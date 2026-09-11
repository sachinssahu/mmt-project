# Phase 2 — Entities, Base Entity & Auth

Picks up from `03-migrations-and-datasource.md`.

---

## 1. What got built

- All 10 entities written by hand
- A shared `BaseEntity` for timestamps
- First migration generated and run → 10 real tables in Postgres
- Working `POST /auth/register` and `POST /auth/login` with JWT
- Swagger docs at `/api`
- A static login/register page at `/`

---

## 2. Entity patterns I learned

### File and folder layout

Copied my org's style — feature folders with sub-folders:

```
src/
  users/entities/user.entity.ts
  users/enums/user-role.enum.ts
  buses/entities/bus.entity.ts
  buses/entities/seat.entity.ts        ← Seat lives under buses
  bookings/entities/booking-seat.entity.ts
  common/entities/base.entity.ts
```

**Seat lives under `buses`** and **BookingSeat under `bookings`** because neither has meaning on its own.
They're never queried alone and never get their own module or controller.

Naming: file is kebab-case (`booking-seat.entity.ts`), class is PascalCase (`BookingSeat`),
enum file is **singular** (`payment-status.enum.ts`) because it holds one enum.

### `nest g` creates the module, I create the entity

```bash
nest g module cities        # folder + cities.module.ts + auto-imports into app.module.ts
mkdir -p src/cities/entities
# then create the .entity.ts in VS Code
```

The **auto-import into `app.module.ts`** is the real reason to use the CLI. Doing it by hand means
forgetting and getting confusing errors.

To **delete** a module: `rm -rf src/<name>` then remove the two lines from `app.module.ts`.
There's no CLI delete command.

### The four parts of every entity file

1. imports from `typeorm`
2. `@Entity('table_name')` class-level decorator
3. the class
4. one decorator + one property per column

```ts
@Entity('cities')
@Index('uq_city_name_state', ['name', 'state'], { unique: true })
export class City extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 100 })
  name: string;
}
```

### Key rules I kept getting wrong

| Rule | Why |
|---|---|
| **NOT NULL is the default** | TypeORM inverts SQL. Only mark exceptions with `nullable: true`. |
| **`name:` is required for snake_case** | Without it, the column is literally `createdAt`. Silent, no error. |
| **`@Index` uses PROPERTY names** | `['busId', 'seatNumber']` not `['bus_id', 'seat_number']` |
| **`@Check` uses COLUMN names** | It's raw SQL — `'age > 0'`. Opposite of `@Index`. Easy to trip over. |
| **Enum columns need `type: 'enum'`** | TypeORM can't infer a Postgres enum type |
| **Type the property as the enum** | `busType: BusType` not `busType: string` — otherwise the enum bought nothing |
| **Single-column unique goes inline** | `@Column({ unique: true })` |
| **Multi-column unique goes class-level** | belongs to the table, not any one property |

### Relations

```ts
@ManyToOne(() => Bus)
@JoinColumn({ name: 'bus_id' })
bus: Bus;

@Column({ name: 'bus_id' })
busId: number;
```

- `@ManyToOne(() => Bus)` — many seats, one bus. **FK always goes on the "many" side.**
  The arrow function `() => Bus` delays evaluation so circular imports don't break.
- `@JoinColumn({ name: 'bus_id' })` — names the actual FK column. Only the "many" side gets this.
- `bus: Bus` — the object. **Not loaded by default** — needs `find({ relations: ['bus'] })`.
  Deliberate, or every query would drag in half the database.
- `busId: number` — the raw id, no join needed.

**Why both?** Two views of one column. Use `busId` to filter/compare/save. Use `bus` when you need
the actual data (`seat.bus.registrationNumber`).

**Two relations to the same table** (Route → City twice): needs two different property names
(`fromCity` / `toCity`) and two different `@JoinColumn` names (`from_city_id` / `to_city_id`).
A class can't have two properties with the same name — `city: City` twice is an error.

---

## 3. BaseEntity — the DRY fix

Wanted `timestamptz` everywhere instead of plain `timestamp` (stores timezone, converts to UTC —
safer if this ever goes multi-country). Rather than editing 10 files:

`src/common/entities/base.entity.ts`:

```ts
export abstract class BaseEntity {
  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt: Date;
}
```

Then every entity: `export class City extends BaseEntity {` and delete both timestamp properties.

- `abstract` = can't be instantiated directly, only extended. Gets no table of its own; TypeORM copies
  its columns into each child.
- **Payoff:** when I add `deletedAt` in phase 2, I change **one file instead of ten.**
- **Watch out:** TypeORM ships its own `BaseEntity` (Active Record pattern). If autocomplete imports
  from `'typeorm'`, that's the wrong one.

### Verifying a bulk change with grep

```bash
grep -rn "extends BaseEntity" src/                        # should list 10 files
grep -rn "CreateDateColumn\|UpdateDateColumn" src/        # should show ONLY base.entity.ts
grep -rn "import.*BaseEntity" src/                        # every line should end in base.entity'
```

grep flags: `-r` recursive, `-n` line numbers, `-i` ignore case, `-l` filenames only,
`-v` invert (show non-matching), `-E` extended regex (so `|` works without escaping).

### `@CreateDateColumn` already has `DEFAULT now()`

Asked why I didn't write the default explicitly — because the decorator generates it.
A plain `@Column` would need `default: () => 'CURRENT_TIMESTAMP'` (arrow function = SQL to run,
not a literal string).

One difference from the ER diagram: `@UpdateDateColumn` updates on save **through TypeORM**, not via a
database trigger. A raw SQL update outside the app wouldn't touch it.

---

## 4. Migration run

```bash
npm run migration:generate -- src/migrations/InitialSchema
npm run migration:show      # [ ] pending
npm run migration:run
```

Verified in TablePlus (much nicer than psql for browsing). First registered user row:

```
1 | Sachin | sachin@test.com | +911234567890 | $2b$10$splDMRp... | USER
```

Everything designed in phase 1 confirmed working: bcrypt hash not plaintext, `+91` prefix applied,
role defaulted to USER, timestamptz on both timestamps.

---

## 5. Controller / Service / DTO / Module

The restaurant analogy:

| Piece | Role | Contains |
|---|---|---|
| **Controller** | the waiter | HTTP only — route, method, what comes in/out. No logic. |
| **Service** | the kitchen | all business logic. Knows nothing about HTTP. |
| **DTO** | the order slip | shape of data in/out + validation rules. No behaviour. |
| **Module** | the restaurant | groups them, declares dependencies |

### Why split them — the real reason for THIS project

**My seed script needs to create an admin user.** It needs the same hash-and-save logic, but it's a
script, not an HTTP request — it can't call a controller. With the logic in a service,
`authService.register(...)` works from anywhere. Without it, I'd copy-paste the hashing code and
they'd drift apart.

Also: services can be tested by calling the function directly, no HTTP server needed.
And controllers stay short instead of becoming 80 lines.

(Same reason GraphQL resolvers or a CLI command would call the same service — different doors into
the same behaviour. Not building those, but that's the pattern.)

### `.spec.ts` files

Jest test files. `.spec` = "specification", just a naming convention — nothing to do with CommonJS.
The generated ones have one placeholder test. Testing is out of scope, so leaving them alone —
they cost nothing and show I know tests exist.

---

## 6. Things that broke, and why

### `-D` vs `-d`

Different programs, same letter. `-D` = npm dev dependency. `-d` = TypeORM dataSource file.
(Covered in `03-`.)

### `ERR_REQUIRE_CYCLE_MODULE` on `nest g module`

The CLI's `ora` dependency went ESM-only while the CLI still `require()`s it. **Not my code** — all
paths were inside `node_modules/@nestjs/cli`.

Fixed by moving to **Node 24.15.0** (org default is 22.12.0). Newer Node bridges ESM/CommonJS better.

```bash
nvm use 24.15.0
npm i -g @nestjs/cli        # global packages are PER Node version — had to reinstall
rm -rf node_modules package-lock.json && npm install
```

Added `.nvmrc` with `24.15.0` so the version is pinned per-project and committed.

**`.nvmrc` vs `.npmrc`:** `.nvmrc` = which Node version. `.npmrc` = npm settings (registry, auth
tokens). **Never commit an `.npmrc` with a token in it.**

### `key: value` outside an object — twice

```ts
passwordHash: await bcrypt.hash(dto.password, 10);   // does nothing
```

```ts
useFactory: (config) => {
  secret: config.get('JWT_SECRET'),                  // does nothing
}
```

`key: value` syntax only works **inside an object**. Standing alone, TypeScript reads it as a **label**
and silently discards it. No error.

For the arrow function, wrap in parentheses so `{` means "object" not "function body":

```ts
useFactory: (config) => ({ secret: ... })
```

### ValidationPipe registered after `listen()`

```ts
await app.listen(3000);
app.useGlobalPipes(new ValidationPipe());   // too late, never applied
```

`listen()` starts the server. **Configure everything first, `app.listen()` is always the last line.**

Symptom: `"email":"notanemail"` returned 401 from the service instead of 400 from validation.

### ServeStaticModule in the wrong file

Anything ending in `Module` goes in `app.module.ts`'s `imports` array — a **flat list**, all siblings.
`main.ts` is for configuring the app *instance* (pipes, Swagger, CORS).

---

## 7. Auth implementation

### Packages

```bash
npm i @nestjs/jwt @nestjs/passport passport passport-jwt bcrypt class-validator class-transformer
npm i -D @types/passport-jwt @types/bcrypt
```

`@types/x` = TypeScript definitions for packages written in plain JS. Dev-only because types vanish
at compile time.

### DTOs

```ts
export class RegisterDto {
  @IsString() @MinLength(2)  name: string;
  @IsEmail()                 email: string;
  @Matches(/^[6-9]\d{9}$/)   phone: string;
  @IsString() @MinLength(8)  password: string;
}
```

Decorators are **PascalCase** — `@IsEmail` not `@isEmail`.

**`password`, not `passwordHash`** — the DTO describes what *arrives*, not what gets stored.
The service does the hashing.

Turned on in `main.ts`:

```ts
app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
```

**`whitelist: true` strips any property not in the DTO.** So if someone POSTs `role: "ADMIN"` hoping
to promote themselves, it's silently dropped. Worth having.

### The service

```ts
constructor(
  @InjectRepository(User)
  private usersRepository: Repository<User>,
  private jwtService: JwtService,
) {}
```

- `@Injectable()` — marks the class as something Nest can create and inject
- `@InjectRepository(User)` — asks for TypeORM's repository for that entity (the object you query
  through: `find`, `findOne`, `create`, `save`)
- `private` on a **parameter** = TypeScript shortcut that auto-creates `this.usersRepository`
- `private` on the **constructor** = blocks Nest from creating the service at all. Different meaning,
  same word. I hit this.

**register:**
1. `findOne({ where: { email } })` → if found, `throw new ConflictException(...)` → HTTP 409
2. `bcrypt.hash(dto.password, 10)` — 10 is the cost factor, higher = slower = safer
3. `create({...})` builds the object in memory, `save()` writes it to the DB
4. prepend `'+91'` to phone
5. **return without the hash**

**login:**
1. `findOne` → if missing, `UnauthorizedException`
2. `bcrypt.compare(plain, hash)` → returns **true when correct**. I had the condition inverted at first.
3. sign the token

```ts
const payload = { sub: existing.id, email: existing.email, role: existing.role };
return { accessToken: await this.jwtService.signAsync(payload) };
```

`sub` is the standard JWT field for "subject" (the user id). Including `role` lets a guard check
permissions without a DB lookup.

> **A JWT is signed, not encrypted.** Anyone can decode and read it. Never put secrets in the payload.

**Security note:** currently returning `'email not found'` vs `'incorrect password'` for easier
debugging, with the generic version commented out. **Different messages leak which emails are
registered.** Must switch both to `'Invalid credentials'` before this is shown to anyone.

### The module wiring

```ts
imports: [
  TypeOrmModule.forFeature([User]),
  JwtModule.registerAsync({
    inject: [ConfigService],
    useFactory: (config: ConfigService) => ({
      secret: config.get<string>('JWT_SECRET'),
      signOptions: { expiresIn: '1d' },
    }),
  }),
],
```

- **`forFeature([User])` is what makes `@InjectRepository(User)` resolve.** Without it: "can't resolve
  dependencies" at boot. (`forRoot` in app.module = the connection. `forFeature` = per-module
  registration.)
- `registerAsync` for the same reason TypeORM used it — must wait for ConfigService to load `.env`.

### The controller

```ts
@Controller('auth')                        // route prefix → everything starts /auth
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')                        // POST /auth/register
  register(@Body() dto: RegisterDto) {     // @Body extracts JSON + triggers validation
    return this.authService.register(dto);
  }
}
```

No `async` needed — returning the promise is enough, Nest awaits it.

---

## 8. Testing it

```bash
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Sachin","email":"sachin@test.com","phone":"9876543210","password":"password123"}'
```

curl breakdown: `-X` method, `-H` header (tells the server the body is JSON), `-d` the body,
`\` = continue on next line.

Cases verified:
- register → user row in DB with bcrypt hash ✓
- login → `accessToken` ✓
- duplicate email → 409 ✓
- invalid email format → 400 from DTO validation ✓

**Swagger** at `/api` — auto-generates a browsable UI from the DTOs. Ten minutes to add and it's what
backend teams actually use for API docs.

---

## 9. Where I am

**Done:**
- Phase 0 — setup, Docker, Postgres, TypeORM wired
- Phase 1 — schema designed, 10 entities, migration run, real tables
- Phase 2 — register + login working, JWT, validation, Swagger

**Not done:**
- JWT guard + `GET /auth/me` (endpoints aren't protected yet)
- Seed script
- Search, seat map, booking ← **the actual interesting part**

---

## 10. Talking points for the 1-1

### Lead with the design, not the code

1. **"A booking is against a Trip, not a Bus"** — a bus runs Bangalore→Chennai tonight and
   Chennai→Bangalore tomorrow. Trip = bus + route + date + time. Beginners book against the Bus and
   the schema breaks the moment the same bus runs twice.

2. **"Availability is derived, never stored"** — an `isAvailable` boolean on Seat can't answer
   "booked tonight, free tomorrow." One column, two truths. So a seat is free on a trip if no
   `booking_seats` row exists for that (trip, seat). The booking rows **are** the availability data.
   Same reasoning killed `maxSeats` on Bus.

3. **"Two people click the same seat at the same millisecond"** — a code-level check always loses
   the race; there's a gap between check and insert. So `UNIQUE (trip_id, seat_id)` at the DB level.
   Postgres accepts the first insert and rejects the second. **The database is the referee** — it
   holds no matter how many app servers are running.

4. **"`trip_id` is duplicated on `booking_seats` on purpose"** — a unique constraint can only use
   columns in its own table. If trip lived only on `bookings`, that constraint couldn't be written
   at all.

5. **"`synchronize: false`, using migrations"** — auto-sync silently drops columns with data in them.

### Decisions with reasons

- **TypeORM over Sequelize** — TypeScript-native, decorator-based, official Nest module. (We use both
  at work on separate connections; I only need one.)
- **`decimal(10,2)` for money, never float** — rounding bugs. Note TypeORM returns it as a *string*.
- **Phone stored E.164 (`+91...`)** — UI takes 10 digits, service prepends. Multi-country later needs
  no migration, no new database, no new servers. Country is just data.
- **Enums over varchar** — `varchar` would accept `"adminn"`.
- **`whitelist: true` on validation** — silently strips `role: "ADMIN"` from a request body.

### Deliberately deferred (and why)

- **Soft delete** — retrofitting `deletedAt` onto a table with a unique constraint means dropping and
  rebuilding it as a **partial index** (`WHERE deleted_at IS NULL`). TypeORM can't generate those, so
  it's a hand-written migration. Left it as a learning exercise.
- **Payments** — status field only, no gateway
- **Cancellation, admin CRUD, notifications, OTP, observability, frontend**

> Cut scope that's **documented** reads as planning. Cut scope that's **silent** reads as failure.

### Questions to ask

- Is 3-4 days calendar time, or 3-4 days of my time? Alongside normal work or instead of it?
- Payments: one row per attempt, or one row with changing status?
- Testing expectations?
- Deploy, or is local enough?
- Weekly review rather than only a final demo?
- **What would a strong outcome look like to you?**

### Be straight about scope

Honest position, said calmly:

> *"With my current JS level, the time I have gets a solid core — schema, auth, search, booking with
> proper transaction handling. Payments, cancellations and admin would need longer. Would you rather
> have a small thing done well or a big thing done badly?"*

---

## 11. Next

1. JwtStrategy + guard + `GET /auth/me` — proves the token works
2. Seed script (plain TypeScript through the entities — Google Sheets needs OAuth and a client
   library, CSV is the cheaper middle ground if data needs to be editable outside code)
3. `GET /trips?from=&to=&date=` — search
4. `GET /trips/:id/seats` — seat map
5. `POST /bookings` — **the transaction + unique constraint. The actual point of the project.**
