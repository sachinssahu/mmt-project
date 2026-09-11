# MMT — Bus Ticket Booking

A backend for booking bus tickets. Search buses between two cities on a date, pick specific seats, enter passenger details, and book.

Built with **NestJS**, **TypeORM** and **PostgreSQL**. Backend-heavy by design — the schema and the concurrency handling are the focus, not the UI.

---

## The core problem

**A seat must never be sold twice, even when two people click it at the same millisecond.**

A check in application code cannot win that race — there is always a gap between "is this seat free?" and "insert the booking". Two requests can both pass the check before either inserts.

So the guarantee lives in the database:

```sql
UNIQUE (trip_id, seat_id)
```

Both requests attempt the insert. Postgres accepts the first and rejects the second. The application catches that rejection and tells the second user to pick another seat.

The database is the referee — the constraint holds no matter how fast requests arrive or how many app servers are running.

---

## Schema

ER diagram: https://dbdiagram.io/d/mmt_bus-6aa14a7170fd27e3c75a1d79

10 tables: `users`, `operators`, `buses`, `seats`, `cities`, `routes`, `trips`, `bookings`, `booking_seats`, `payments`.

### Two design decisions worth calling out

**A booking points at a Trip, not a Bus.**
Bus KA-01-1234 runs Bangalore→Chennai tonight and Chennai→Bangalore tomorrow. A Trip is a specific bus, on a specific route, departing at a specific date and time. Booking against the Bus breaks the moment the same bus runs twice.

**Availability is derived, never stored.**
There is no `isAvailable` column on `seats`. Seat 12 is booked on tonight's trip and free on tomorrow's — one boolean cannot hold two truths. A seat is free on a trip if no `booking_seats` row exists for that `(trip_id, seat_id)`. The booking rows *are* the availability data, so nothing can drift out of sync.

The same reasoning removed `maxSeats` from `buses` — the real count is `SELECT COUNT(*) FROM seats WHERE bus_id = ?`.

### Constraints enforced at the database level

| Constraint | Purpose |
|---|---|
| `UNIQUE (trip_id, seat_id)` on `booking_seats` | prevents double-booking |
| `UNIQUE (bus_id, seat_number)` on `seats` | no two seats "A1" on one bus |
| `UNIQUE (from_city_id, to_city_id)` on `routes` | no duplicate routes |
| `UNIQUE (name, state)` on `cities` | no duplicate cities |
| `CHECK (age > 0 AND age < 100)` on `booking_seats` | valid passenger age |
| `INDEX (route_id, departure_time)` on `trips` | search performance |

---

## Tech choices

| Choice | Why |
|---|---|
| **TypeORM** over Sequelize | TypeScript-native and decorator-based, so it matches NestJS's own design. Ships an official `@nestjs/typeorm` module, and entity classes double as type definitions. |
| **PostgreSQL** | Strong transaction, locking and constraint support — exactly what the double-booking problem needs. Partial indexes are useful for the planned soft-delete work. |
| **Docker for Postgres** | `docker-compose.yml` lives in the repo, so anyone cloning gets an identical database in one command. No local install to maintain. |
| **Migrations, `synchronize: false`** | Auto-sync silently drops columns that have data in them. Every schema change is an explicit, reviewable file. |
| **`decimal(10,2)` for money** | `integer` can't hold ₹450.50; `float` causes rounding errors. |
| **Phone stored E.164** (`+919876543210`) | The UI accepts 10 digits and the service prepends `+91`. Supporting other countries later needs no migration. |
| **Enums over varchar** | `varchar` would happily accept `"adminn"`. |

---

## Running locally

**Prerequisites:** Node (see `.nvmrc`), Docker.

```bash
git clone https://github.com/sachinssahu/mmt-project.git
cd mmt-project

nvm use                    # Node version from .nvmrc
npm install

cp .env.example .env       # fill in values

docker compose up -d       # starts Postgres, creates the mmt_bus database
npm run migration:run      # creates the tables

npm run start:dev
```

- API → http://localhost:3000
- Swagger docs → http://localhost:3000/api

> The default Postgres port 5432 is often already taken. `docker-compose.yml` maps it to **5433** on the host, so `.env` must use `DB_PORT=5433`.

### Migration commands

```bash
npm run migration:generate -- src/migrations/Name   # generate from entity diff
npm run migration:show                              # [X] applied, [ ] pending
npm run migration:run
npm run migration:revert
```

---

## API

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/auth/register` | — | Create an account |
| `POST` | `/auth/login` | — | Returns a JWT access token |
| `GET` | `/auth/me` | Bearer | Current user from the token |

Protected routes expect `Authorization: Bearer <token>`.

Full request and response shapes are browsable in Swagger at `/api`.

### Validation

Every endpoint validates its input with `class-validator` DTOs. The global pipe runs with `whitelist: true`, which strips any property not declared on the DTO — so a request body containing `role: "ADMIN"` has that field silently dropped rather than honoured.

### Passwords

Hashed with bcrypt (cost factor 10). The plaintext password is never stored, and the hash is never returned in any response.

---

## Project structure

```
src/
  auth/
    dto/                   # RegisterDto, LoginDto
    guards/                # JwtAuthGuard
    strategies/            # JwtStrategy
    decorators/            # @CurrentUser()
  users/
    entities/
    enums/
  buses/
    entities/              # Bus, Seat — Seat has no meaning without a Bus
    enums/
  bookings/
    entities/              # Booking, BookingSeat
    enums/
  cities/ operators/ routes/ trips/ payments/
  common/
    entities/base.entity.ts   # shared createdAt / updatedAt
  migrations/
  data-source.ts           # TypeORM CLI config (runs outside Nest, so reads .env directly)
```

Feature-based folders, matching the conventions used on my team. Sub-entities live under the feature that owns them.

---

## Status

**Done**

- [x] Schema design and ER diagram
- [x] 10 entities with relations, indexes and constraints
- [x] Migrations
- [x] Register / login with bcrypt and JWT
- [x] JWT strategy, guard, and a protected route
- [x] DTO validation
- [x] Swagger docs

**In progress**

- [ ] Seed script
- [ ] `GET /trips` — search by route and date
- [ ] `GET /trips/:id/seats` — seat map
- [ ] `POST /bookings` — booking inside a transaction
- [ ] `GET /bookings` — booking history

---

## Deliberately deferred

Scope cut on purpose, with reasons — not things that were forgotten.

| Deferred | Reason |
|---|---|
| **Soft delete (`deletedAt`)** | Retrofitting it onto `booking_seats` means rebuilding the unique constraint as a **partial index** (`WHERE deleted_at IS NULL`) — a soft-deleted row would otherwise occupy the seat forever. TypeORM can't generate partial indexes, so it's a hand-written migration. Left as a deliberate exercise. |
| **Payment gateway** | Status field only. A real integration would consume the whole timeline without demonstrating anything about the schema. |
| **Cancellation and refunds** | Depends on soft delete above. |
| **Bus operator as a user role** | No functional requirement uses it yet. Unused roles shouldn't sit in the schema. |
| **Admin CRUD APIs** | Seeding covers the same need for now. |
| **Notifications, OTP login** | Both need third-party providers. |
| **Observability** | Would use OpenTelemetry rather than a vendor SDK, so the same instrumentation works with Datadog. |
| **Frontend** | Backend-first by design. A minimal static page exists for manual testing. |

---

## Notes

`notes/` contains the working notes written while building this — design decisions, things that broke and why, and the reasoning behind each choice.
