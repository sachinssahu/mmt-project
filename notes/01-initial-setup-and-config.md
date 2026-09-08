# Phase 0 — Initial Setup & Config

Project: **MMT Bus Ticket Booking** (backend)
Stack: NestJS + TypeORM + PostgreSQL (Docker)

Goal of this phase: **`npm run start:dev` boots and connects to Postgres.** No features yet.

---

## 1. The project brief

What my manager gave me:

> Make My Trip - Bus Ticket Booking. Backend heavy, web at the end.
> Must include: NestJS, Sequelize/TypeORM, Authentication and Authorization, basics of database implementation.

What that actually tells me:

- "backend heavy" + "database is a must" = **the schema is what gets judged**
- NestJS is fixed, don't question it
- ORM is my choice, but I must justify it
- Frontend is last and optional

A brief is never a full spec. Three things are always missing and I have to go get them:
**scope** (what's in/out), **constraints** (tech, time, conventions), **definition of done** (how he knows I succeeded).

---

## 2. Decisions made, and why

### Why TypeORM over Sequelize?

TypeORM is written in TypeScript and uses decorators, so it matches NestJS's own design.
Nest ships an official `@nestjs/typeorm` module. Entity classes double as my type definitions.

Sequelize works fine, but its TypeScript support is bolted on afterwards.

> Note: my org uses **both** — TypeORM and Sequelize on separate database connections in one app.
> I'm not copying that. One ORM, one database. But good to mention in the 1-1.

### Why PostgreSQL?

My hard problem is **two people booking the same seat at the same time**.
Postgres is strong at transactions, locking and constraints, which is exactly what that needs.

Also it's the most common choice in Node backends → good for portfolio.

### Why Docker instead of installing Postgres normally?

Postgres runs in a sealed box.

- Delete and recreate in seconds, laptop stays clean
- `docker-compose.yml` lives in my repo, so anyone who clones it gets the **exact same database**
- No "works on my machine"

Layman's version: instead of installing a fridge into my kitchen wall, I rent a fridge on wheels.
Don't like it? Roll it out. Kitchen untouched.

### Why CommonJS and not ESM?

NestJS 12 asks this now because it became ESM-ready.

Both work. CommonJS is safer for me because almost every tutorial, StackOverflow answer and
TypeORM guide assumes it. ESM causes small annoying errors nobody has written about yet —
especially TypeORM migrations, which get fussy about file paths and extensions.

Also checked my org's repo: `tsconfig.json` says `"module": "CommonJS"`. Matching them.

I have 3-4 days. Not spending one on module system errors.

### Why I said NO to `@nestjs/observe`

NestJS 12 offers to wire up auto-instrumented observability during `nest new`.

I assumed it was a connector to Datadog. **It isn't.** It's NestJS's own cloud service —
sign up at observe.nestjs.com, get an app key + secret, data goes to their dashboard.
It cannot point at Datadog and cannot run locally.

So it doesn't give me what I want anyway.

Also: observability answers "which endpoint is slow in production, and why."
I have no production traffic and no endpoints. Instrumenting an empty room.

**Can I add it later?** Yes — it's opt-in, nothing to migrate. Roughly 20 minutes:
install the package, ~5 lines in `app.module.ts` and `main.ts`, key + secret in `.env`.

**What I'd actually use instead:** OpenTelemetry + Jaeger.
OpenTelemetry is a vendor-neutral standard; Jaeger runs locally in Docker and shows the traces.
Datadog also accepts OpenTelemetry, so later I'd change only the destination URL, not my code.

→ Parked in README under Phase 2.
Good line for the 1-1: *"I deliberately left observability for phase 2, and I'd use
OpenTelemetry so it works with Datadog later."*

### Free monitoring tools (for later, not now)

- **Uptime monitoring** = pings my URL, alerts me if it's down → UptimeRobot, BetterStack
- **APM** = traces what happens *inside* the app, which route was slow, which query → Sentry, Grafana Cloud
- Cheap win to add in Phase 8: a `GET /health` endpoint returning `{ status: 'ok' }` + a DB check.
  Takes 10 min, gives UptimeRobot something to ping, and reviewers look for it.

---

## 3. What I checked in my org's repo

Worth copying the *style*, not the complexity.

| Thing | How to check | What I found |
|---|---|---|
| Module system | `tsconfig.json` → `"module"` | `CommonJS` |
| ORM | `package.json` dependencies | both TypeORM **and** Sequelize |
| Folder structure | look at `src/` | `src/user/service.ts`, `dto/`, `enum/`, `bo/`, plus `src/models` |
| Env handling | look for `.env.example` / `env/` folder | `env/` folder with `development.env`, `test.env`; copy to root, rename `.env` |
| Linting | root files `.eslintrc*` / `.prettierrc*` | uses both |

If `tsconfig.json` has no `"module"` line, check for `"extends"` at the top — settings live in the parent file.
If there's no `"module"` anywhere and `package.json` has no `"type": "module"`, it's **CommonJS** (that's the default).

**dto** = Data Transfer Object. The shape of data coming in/out of an API.

```ts
// create-booking.dto.ts
export class CreateBookingDto {
  tripId: number;
  seatIds: number[];
}
```

That's all it is — a class describing "what the request body must look like." I'll use these a lot.
`bo` = Business Object. Skipping it.

**ESLint vs Prettier** — easy to mix up:

- **ESLint** catches mistakes and bad patterns. e.g. declared a variable, never used it → warns.
- **Prettier** is formatting only. Spaces, quotes, line breaks. Doesn't care if code is correct.

```ts
const name    =    'ram'     // I write this
const name = 'ram';          // Prettier saves this
```

`nest new` already created both with sensible defaults. Leaving them alone.

---

## 4. Step-by-step setup

### Step 1 — Install the NestJS CLI

```bash
npm i -g @nestjs/cli
```

- `npm` = Node Package Manager. Downloads code libraries other people wrote.
- `i` = short for `install`
- `-g` = **global**. Installs once for the whole computer, usable in any folder.
  Without `-g` it installs only into the current project.
- `@nestjs/` = a scope, like a namespace. Tells me it's official NestJS.
- `cli` = Command Line Interface, a tool I run by typing instead of clicking.

Result: I can now type `nest` anywhere.

### Step 2 — Create the project

```bash
nest new mmt_project
```

Generates a complete starter project — `src/`, `package.json`, TypeScript config, test setup.
This is called **scaffolding**. Beats creating 20 files by hand.

At the end it runs `npm install`, creating `node_modules/`.
That folder is huge, never edited, never committed. It can be rebuilt anytime from `package.json`.

**Prompts it asked me:**

| Prompt | My answer | Why |
|---|---|---|
| Package manager | npm | default, fine |
| `@nestjs/observe`? | **N** | see decision above. Capital N = pressing Enter also means No |
| Module system | **CommonJS** | see decision above |

### Step 3 — Go into the folder

```bash
cd mmt_project
```

`cd` = change directory. The terminal always sits "inside" some folder and commands run relative to it.
`nest new` created the folder but didn't move me in.

Lost? `pwd` (Mac/Linux) or `cd` alone (Windows) shows where I am.

### Step 4 — Confirm NestJS works before touching anything else

```bash
npm run start:dev
```

Open `http://localhost:3000` → should say **Hello World!**

- `npm run` executes a **script** defined in `package.json` (open it, look at `"scripts"`)
- `start:dev` runs in **watch mode** — recompiles and restarts every time I save a file.
  I'll leave this running in a terminal all day.

### Step 5 — Postgres via Docker

Create `docker-compose.yml` in the project root, then:

```bash
docker compose up -d
```

- `docker compose` reads `docker-compose.yml` in the current folder
- `up` = create and start the containers
- `-d` = **detached**, run in the background and give my terminal back.
  Without `-d`, logs take over the terminal and closing it kills the database.

Output I got:

```
Volume mmt_pgdata   Created
Network mmt_default Created
Container mmt_db    Started
```

Got a **volume** (my data storage) and a **network** (so containers can talk to each other later) for free.

Companion commands:

```bash
docker compose down       # stop
docker compose down -v    # stop AND delete the data
docker compose ps         # what's running
docker ps                 # all running containers
```

### Step 6 — Verify the database is actually alive

```bash
docker compose exec mmt_project psql -U postgres -d mmt_bus -c "\dt"
```

- `exec` runs a command **inside** an already-running container
- `db` = the **service** name from my yml (not the container name)
- `psql` = Postgres's built-in terminal client
- `-U postgres` = username, `-d mmt_bus` = which database, `-c` = run one command and exit

Expected: *"Did not find any relations."* → connected fine, no tables yet. Correct at this stage.

Inside psql: `\dt` lists tables, `\q` quits.

### Step 7 — Install the database packages

```bash
npm i @nestjs/typeorm typeorm pg @nestjs/config
```

No `-g` this time → **local**, goes into this project only and gets recorded in `package.json`.
That recording is the point: my manager clones the repo, runs `npm install`, gets the exact same libraries.

- `typeorm` — the ORM itself. **ORM = Object-Relational Mapper**: lets me write
  `userRepository.find()` in TypeScript instead of `SELECT * FROM users` in SQL.
- `@nestjs/typeorm` — the glue connecting TypeORM to NestJS's module system.
  TypeORM works without NestJS; this teaches them to work together.
- `pg` — the Postgres **driver**. The low-level library that actually opens the connection and
  speaks Postgres's protocol. TypeORM is generic across databases and delegates to a driver.
  If I used MySQL, this would be `mysql2` instead.
- `@nestjs/config` — reads `.env` and makes those values available in code.

To remove packages: `npm uninstall <name>`

### Step 8 — Create `.env` in the project root

```
DB_HOST=localhost
DB_PORT=5433
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=mmt_bus
PORT=3000
```

**5433, not 5432** — see the port conflict note below.

Why `.env` exists at all: my database password shouldn't be typed into a source file that gets
committed to GitHub. It lives here instead, git-ignored. My laptop has local values, the deployed
server has real ones, **the code is identical in both places**.

Check it's ignored:

```bash
grep ".env" .gitignore
```

Also commit a `.env.example` with the same keys and fake values, so anyone cloning knows what to fill in.
(Idea stolen from my org's `env/` folder, but simplified — they have one file per environment,
I only need one.)

### Step 9 — Wire TypeORM into NestJS

`src/app.module.ts`:

```ts
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get('DB_HOST'),
        port: Number(config.get('DB_PORT')),
        username: config.get('DB_USER'),
        password: config.get('DB_PASSWORD'),
        database: config.get('DB_NAME'),
        autoLoadEntities: true,
        synchronize: false,
      }),
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
```

- `ConfigModule.forRoot({ isGlobal: true })` — reads `.env`. `isGlobal` means every file can use it
  without importing it again.
- `forRootAsync` — "async" because it must **wait** for ConfigModule to load the env values first.
  With plain `forRoot` the values would be `undefined`.
- `inject: [ConfigService]` + `useFactory` — "give me ConfigService, then run this function to build the settings."
- `autoLoadEntities: true` — any entity I create gets picked up automatically, no manual list.
- `synchronize: false` — **important.** If `true`, TypeORM auto-alters my tables to match my code.
  Convenient for a day, then it silently drops a column with data in it. Using **migrations** instead.
  → Say this out loud on Friday.

### Step 10 — Final check

```bash
npm run start:dev
```

App starts with no red errors → connected. **Phase 0 done.**
It crashes with a connection error → something's wrong (see troubleshooting).

---

## 5. Problems I hit

### Port already allocated

```
Bind for 0.0.0.0:5432 failed: port is already allocated
```

Cause: my **org's** Postgres container was already using 5432.

Rule: **one program per port.** Two Postgres containers cannot both hold 5432.

Fix — in `docker-compose.yml`:

```yaml
ports:
  - "5433:5432"
```

Read as `myLaptopPort : portInsideContainer`.
Inside the container Postgres still listens on 5432 and doesn't know or care what the outside number is.
So only the **left** number changes, and `.env` must say `DB_PORT=5433`.

Check what's holding a port: `docker ps` and look at the PORTS column.

### Ugly container name

Default was `mmt-mmt_project-1` — Docker auto-generates `folder-service-number`.

Fix: add `container_name: mmt_db`.

Note the difference: **service name** (`db`) is what I use in `docker compose exec ...`,
**container name** (`mmt_db`) is what shows in `docker ps`.
Keep them consistent or commands get confusing.

---

## 6. Concepts I asked about

### Why can't Node/browsers run TypeScript?

TypeScript is JavaScript plus type labels. Those labels are a **tool for me**, not instructions for the computer.

```ts
function greet(name: string): string {   // I write this
  return "hi " + name;
}
```

```js
function greet(name) {                   // Node runs this
  return "hi " + name;
}
```

The types are simply **deleted** at compile time. Nothing else changes.

Consequence: TypeScript can't protect me at runtime. If an API sends `{ age: "twenty" }` when I
declared `age: number`, TypeScript won't stop it — the check already happened, before the app ran.
That's why I'll need `class-validator` for incoming requests later.

Compiled output goes to `dist/`. That's the actual JavaScript Node executes, and why `dist` is gitignored.

### Why 5432? Why is it standard?

No deep reason. Postgres picked it in the 90s and it stuck. Same as MySQL 3306, Redis 6379, HTTP 80.

A port is just a door number on my machine — there are 65535 of them.
Any free port works; 5432 is only the **default** everyone assumes.

### The three config files

| File | What it is | Edit it? |
|---|---|---|
| `package.json` | **what I want** — name, scripts, dependencies | yes, handwritten |
| `package-lock.json` | **what I exactly got** — pinned versions incl. sub-dependencies | never, auto-generated |
| `tsconfig.json` | **how to compile** — TS → JS rules | rarely |

Why the lock file matters: `package.json` might say `"typeorm": "^0.3.20"`.
The `^` means "0.3.20 or any newer 0.3.x" — so two people could get different versions.
The lock file records the exact one. Commit it. It looks noisy in git, that's normal.

`tsconfig.json` also enables decorators (`@Injectable()`, `@Entity()`), which NestJS needs.
`nest new` already set that up — don't touch.

### Can I add comments to these?

- `package.json` — **no.** JSON forbids comments, npm will reject the file.
- `tsconfig.json` — yes, it's actually JSONC (JSON with Comments), `//` works.
- Everything else → this notes folder.

### grep

`grep` = search for text inside files. (Old editor command name; just think "find text.")

```bash
grep "hello" file.txt        # lines containing hello
grep -r "DB_HOST" src/       # -r = search all files in a folder
grep -i "error" log.txt      # -i = ignore case
grep -n "TODO" app.ts        # -n = show line numbers
docker ps | grep 5432        # pipe: list containers, show only lines mentioning 5432
```

Why: the project has thousands of lines. Opening files to look is slow.

That's why `grep ".env" .gitignore` — instead of opening the file and reading it,
just ask "is `.env` mentioned in there?" If it prints a line, yes.

Windows PowerShell equivalent: `Select-String`. Or use Git Bash to get real grep.

---

## 7. Git & GitHub

### Create the repo

On github.com → **New repository** → name `mmt_project`.

**Do not** tick "Add README" or ".gitignore" — I already have files locally, and those cause a
conflict on the first push.

Add a description (this is what shows in my repo list, and recruiters read it):
*"Bus ticket booking backend — NestJS, TypeORM, PostgreSQL"*

### First commit

```bash
git init
git add .
git commit -m "chore: setup nestjs, typeorm, postgres"
```

- `git init` — creates the hidden `.git` folder. That folder **is** the repository, all history lives there.
  One-time per project.
- `git add .` — stages files. Git has a **staging area**: editing a file doesn't automatically include
  it in the next snapshot, I choose what goes in. `.` = everything here and below.
  This is where `.gitignore` earns its keep — `node_modules` and `.env` get skipped.
- `git commit -m "..."` — saves everything staged as a permanent snapshot with a message.
  `-m` supplies the message inline; without it, git opens a text editor (probably vim — unpleasant surprise).

**Before pushing, always:**

```bash
git status
```

If `.env` appears in that list — **stop**. Add it to `.gitignore` first.
Pushing secrets to GitHub is hard to undo properly.

### Push

```bash
git branch -M main
git remote add origin https://github.com/USERNAME/mmt_project.git
git push -u origin main
```

`-u origin main` is only needed the first time — it links my local branch to GitHub so later
plain `git push` works.

After that, every save is:

```bash
git add .
git commit -m "feat: add user entity"
git push
```

If it asks for a password: GitHub no longer accepts account passwords.
Need a **Personal Access Token** (Settings → Developer settings) or SSH.

### Commit message prefixes

`chore` is an ordinary English word meaning routine boring work — like washing dishes.
In commits it means setup/maintenance: no new feature, no bug fixed.

| Prefix | Meaning | Example |
|---|---|---|
| `feat:` | new feature | `feat: add booking endpoint` |
| `fix:` | fixed a bug | `fix: seat count wrong on cancel` |
| `chore:` | setup / maintenance | `chore: upgrade typeorm` |
| `docs:` | documentation | `docs: add ER diagram to readme` |
| `refactor:` | rewrote code, same behaviour | `refactor: extract seat lookup` |

Git doesn't require this. It's a convention so history is scannable. Interviewers do look.

### Branching from here

One branch per phase — `feat/entities`, `feat/auth`, `feat/booking` — merged via a PR.
Costs nothing and makes the repo look professional to both my manager and, later, a recruiter.

---

## 8. Phase 0 checklist

- [x] NestJS CLI installed
- [x] Project created (CommonJS, no observe)
- [x] `npm run start:dev` → Hello World
- [x] `docker-compose.yml` written
- [x] Postgres container running (port 5433)
- [ ] `psql` connection verified
- [x] TypeORM + config packages installed
- [x] `.env` created, `.env` gitignored
- [ ] `app.module.ts` wired to TypeORM
- [ ] App boots with **no connection error** ← the real finish line
- [ ] `.env.example` committed
- [ ] Pushed to GitHub

---

## 9. Deliberately deferred (Phase 2 in README)

Cut scope that's **documented** reads as planning. Cut scope that's **silent** reads as failure.

- Observability (`@nestjs/observe` or OpenTelemetry + Jaeger)
- Payments — just a `status` field for now, not even mocked
- Cancellation & refund logic
- Multiple bus operators
- Seat holds with TTL expiry
- Admin CRUD (seeding data instead)
- Frontend
- Tests beyond one or two

---

## 10. Next: Phase 1 — the ER diagram

This is the piece my manager will actually judge — *"basics of database implementation is must."*

Entities to work out: User, City, Bus, Seat, Route, **Trip**, Booking, BookingSeat.

The one beginners miss is **Trip** — a booking is never against a *bus*, it's against a
*bus running a specific route at a specific date and time*. The same bus does Bangalore→Chennai
tonight and Chennai→Bangalore tomorrow.

Also: there is **no `isAvailable` column on Seat**. Availability is *derived* — a seat is free if no
active booking row exists for that trip + seat. Storing it as a flag can't represent
"free on Tuesday, taken on Wednesday."

The hard problem to raise unprompted on Friday: **two people click the same seat at the same moment.**
Answer has three layers — a unique constraint, a transaction, and a seat hold with TTL.
