# Phase 1b — Migrations, data-source.ts & npm scripts

The part I found most confusing. Written out properly so I can explain it on Friday.

---

## 1. The confusing bit first: `-D` vs `-d`

These are **different flags for different programs** that happen to look alike.

| Flag | Belongs to | Means |
|---|---|---|
| `-D` | **npm** | install as a **dev dependency** |
| `-d` | **TypeORM CLI** | which **dataSource** file to use |

They have nothing to do with each other. `npm` and `typeorm` are separate programs, each with its own
flags. Same letter, different meaning — like `-r` meaning "recursive" in `grep` but "require" in `node`.

### `-D` = dev dependency

```bash
npm i -D ts-node tsconfig-paths     # dev only
npm i typeorm pg                    # needed at runtime too
```

`package.json` ends up with two lists:

```json
"dependencies":     { ... }   // needed when the app RUNS in production
"devDependencies":  { ... }   // only needed while DEVELOPING
```

`ts-node` is dev-only because in production the TypeScript is already compiled to JavaScript —
nothing needs to read `.ts` files anymore. `typeorm` is a real dependency because the running app
uses it on every query.

Why separate them: production installs can skip devDependencies (`npm ci --omit=dev`), giving a
smaller, faster, safer deployment.

> `-D` is short for `--save-dev`. Both work.

---

## 2. Reading the long command

This is what actually runs:

```bash
ts-node -r tsconfig-paths/register ./node_modules/typeorm/cli.js -d src/data-source.ts
```

Four parts:

### `ts-node`

Runs TypeScript **directly**.

Normally: `tsc` compiles `.ts` → `.js`, then `node` runs the `.js`.
`ts-node` does both in one step, in memory, no `dist/` folder.

Needed here because `data-source.ts` and all my entity files are TypeScript. Node alone can't read them.

### `-r tsconfig-paths/register`

`-r` = "**require** this module before running anything else." Node's way of loading a module that
patches behaviour.

`tsconfig-paths` handles **path aliases**. If `tsconfig.json` defines:

```json
"paths": { "@app/*": ["src/*"] }
```

…then I could write `import { User } from '@app/users/entities/user.entity'`.

But that alias only exists to the **TypeScript compiler**. Node has never heard of it and would fail
at runtime. This module teaches Node to resolve them.

I'm not using aliases yet. It's in the command because it's the standard incantation and costs nothing.

### `./node_modules/typeorm/cli.js`

The actual program being run — TypeORM's command-line tool.

The explicit path is used because TypeORM is **not** installed globally, it's a project dependency
sitting in `node_modules`.

### `-d src/data-source.ts`

`-d` is short for `--dataSource`. Tells the CLI which config file to load — the file that has
`export default new DataSource({...})`.

### As a sentence

> *"Run TypeScript directly, with path aliases enabled, executing TypeORM's CLI, using this config file."*

Whatever I append (`migration:generate`, `migration:run`) is the CLI's actual instruction.

---

## 3. Why put it in `package.json` scripts

I was right that the long command is horrible. That's exactly why scripts exist.

```json
"scripts": {
  "typeorm": "ts-node -r tsconfig-paths/register ./node_modules/typeorm/cli.js -d src/data-source.ts",
  "migration:generate": "npm run typeorm -- migration:generate",
  "migration:run": "npm run typeorm -- migration:run",
  "migration:revert": "npm run typeorm -- migration:revert",
  "migration:show": "npm run typeorm -- migration:show"
}
```

Now I type `npm run migration:run` instead of that whole line.

Three reasons this matters:

1. **Brevity** — obvious
2. **Discoverability** — anyone opens `package.json` and sees every command the project supports
3. **Consistency** — everyone runs it identically, so "works on my machine" doesn't happen

> My org does the same: `npm run typeorm migration:run`.

### What the `--` does

```bash
npm run migration:generate -- src/migrations/InitialSchema
```

`--` means "**stop parsing arguments here, pass everything after this through**."

Without it, npm would try to interpret `src/migrations/InitialSchema` as its own argument instead of
handing it to the TypeORM CLI.

Note the scripts above **chain**: `migration:generate` calls `npm run typeorm --`, which appends to
the base command. So one long command is defined once and reused five times.

---

## 4. `data-source.ts` — what and why

```ts
import { DataSource } from 'typeorm';
import { config } from 'dotenv';

config();

export default new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  entities: ['src/**/*.entity.ts'],
  migrations: ['src/migrations/*.ts'],
  synchronize: false,
});
```

### Why this file exists at all

**The TypeORM CLI runs outside NestJS.**

When I run `npm run migration:generate`, that's a standalone Node script. NestJS isn't running.
There's no dependency injection, no `ConfigService`, no modules. The CLI is a separate program that
happens to live in the same project.

So it needs its own config, reading `.env` **directly** via `dotenv` instead of `ConfigService`.

### Line by line

| Line | What it does |
|---|---|
| `config()` | reads `.env` and loads it into `process.env` |
| `export default` | so the CLI can find it — this is what `-d src/data-source.ts` points at |
| `type: 'postgres'` | which SQL dialect to generate |
| `host/port/user/...` | connection details from `.env` |
| `Number(process.env.DB_PORT)` | env values are **always strings**, port must be a number |
| `entities: ['src/**/*.entity.ts']` | a **glob** — `**` = any folder depth, `*` = any filename. This is why the `.entity.ts` naming convention mattered |
| `migrations: ['src/migrations/*.ts']` | where existing migrations live, so it knows what's already applied |
| `synchronize: false` | never auto-alter tables. Migrations only. |

### The awkward consequence

Database config now lives in **two** places:

- `app.module.ts` → for the running app (uses `ConfigService`)
- `data-source.ts` → for the CLI (uses `dotenv`)

That's normal for TypeORM. Some projects export one config object and import it into both.
Two files is fine for now.

---

## 5. How `migration:generate` actually works

It **diffs** two things:

1. Connects to Postgres
2. Reads my entity files (via the glob) → *what the schema **should** be*
3. Queries the database → *what the schema **currently** is*
4. Computes the difference
5. Writes SQL to close the gap

That's why it needs **both** the entity paths **and** a live database connection.
Postgres must be running (`docker compose ps`) or it fails.

### The layers

```
entity classes     ← source of truth (my design, in TypeScript)
      ↓  generate
migration file     ← SQL to make the DB match
      ↓  run
actual database    ← real tables
      ↓
migrations table   ← TypeORM's checklist of what's been applied
```

That last one is how it tracks state — one row per migration that has run.
Sequelize does the same thing with `SequelizeMeta`.

---

## 6. The commands

```bash
npm run migration:generate -- src/migrations/InitialSchema   # create from entity diff
npm run migration:show                                       # [X] = run, [ ] = pending
npm run migration:run                                        # apply pending ones
npm run migration:revert                                     # undo the last one
```

`migration:show` is the TypeORM equivalent of my org's `sequelize db:migrate:status`.

Output looks like:

```
[X] CreateUsersTable1234567890
[ ] AddOperatorsTable1234567891
```

There's also `migration:create` (not `generate`) — makes an **empty** file to fill in by hand.
I'll need that for things TypeORM can't generate, like **partial indexes**.

### Verify in the database

```bash
docker compose exec db psql -U postgres -d mmt_bus -c "\dt"          # list tables
docker compose exec db psql -U postgres -d mmt_bus -c "\d booking_seats"   # full table definition
```

`\d <table>` shows columns, indexes, constraints and foreign keys. This is how I confirmed
`uq_trip_seat` and `check_valid_age` actually made it in.

---

## 7. The migration file: `up` and `down`

```ts
export class InitialSchema1788993455997 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // creates tables, enums, indexes, constraints
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // drops them — the undo
  }
}
```

- `up()` runs on `migration:run`
- `down()` runs on `migration:revert`

The number in the class name is a **timestamp** — that's how TypeORM knows what order to run them in.

> **Always read the generated `down()`.** TypeORM reverses the statements automatically, but it can't
> always get it right for complex changes. A broken `down` is only discovered when I desperately
> need it.

---

## 8. Those weird constraint names

```sql
CONSTRAINT "PK_a4d929dea33a0153ba9bc253db1" PRIMARY KEY ("id")
```

**Auto-generated.** TypeORM hashes the table + column names to produce a unique identifier for any
constraint I didn't name myself.

Every constraint in Postgres needs a name — it's how you'd later drop or alter it.

- I **named** the ones I cared about → `uq_trip_seat`, `check_valid_age`, `idx_trip_route_departure`
- Primary keys and foreign keys I didn't name → hashes

**Why it matters:** when a constraint fails, the error message shows the name. `uq_trip_seat` tells me
instantly what happened. `PK_a4d929de...` tells me nothing.

Since I named the ones that will actually fire in normal operation, this is fine.

> Can be named explicitly if wanted — `@PrimaryGeneratedColumn({ primaryKeyConstraintName: '...' })`.
> Most people don't bother, because you rarely reference a PK constraint by name.

---

## 9. Does TypeORM generate entities too?

Asked this — the answer is **no, not in the direction I'm working.**

- `typeorm-model-generator` (third-party) reads an **existing** database and produces entity files.
  Useful when inheriting a legacy DB with no code. That's backwards from what I'm doing.
- TypeORM's `entity:create` makes an empty class with no columns. Not worth it.
- **Nothing generates enums.** Those are pure TypeScript.

My direction — entities as source of truth, database generated from them — is the normal one for a
new project. That's exactly why `migration:generate` diffs entities against the DB.

---

## 10. Full setup sequence (goes in README)

```bash
git clone <repo>
cd mmt_project
nvm use                    # reads .nvmrc → Node 24.15.0
npm install
cp .env.example .env
docker compose up -d       # starts Postgres, creates empty mmt_bus database
npm run migration:run      # creates the 10 tables inside it
npm run seed               # TODO
npm run start:dev
```

Note there's no "create database" step — `POSTGRES_DB: mmt_bus` in `docker-compose.yml` already made
the empty database. Migrations create the **tables** inside it.

Eight lines and someone has the project working. First thing a reviewer tries.

---

## 11. What I built

Ran successfully:

```
Migration .../src/migrations/1788993455997-InitialSchema.ts has been generated successfully.
```

10 tables + the `migrations` tracking table. Includes:

- all enum types
- all foreign keys
- `uq_trip_seat` unique index ← the correctness constraint
- `check_valid_age` CHECK constraint
- `idx_trip_route_departure` search index

**Deferred to a later hand-written migration** (using `migration:create`, not `generate`):

- `deleted_at` soft delete columns
- converting `uq_trip_seat` into a **partial** unique index (`WHERE deleted_at IS NULL`)
- the partial index preventing two successful payments per booking

TypeORM decorators can't express partial indexes, so those must be written by hand. That's the
learning exercise I deliberately left for myself.
