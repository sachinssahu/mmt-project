# Phase 1 — Design Doc (Schema & LLD)

Project: **MMT Bus Ticket Booking**
ER diagram: https://dbdiagram.io/d/mmt_bus-6aa14a7170fd27e3c75a1d79

---

## 1. Problem statement

A backend for booking bus tickets. A customer picks a source city, destination city and travel
date, sees the buses running that day, picks specific seats, enters passenger details, and pays.

The system must guarantee that **the same seat is never sold twice**, even when two people click
it at the same moment.

Backend-heavy by design. Frontend is deferred.

---

## 2. Scope

### In scope

- Auth: register + login with password, JWT, role-based access
- Search trips by from-city + to-city + date
- Seat map for a trip (which seats are free)
- Book specific seats with passenger details
- Mock payment (status only, no gateway)
- Booking history
- Admin: data seeded via script

### Out of scope (deliberately deferred → README Phase 2)

| Deferred | Why |
|---|---|
| Real payment gateway | Would eat the whole timeline. Status field is enough to show the model. |
| Cancellation & refunds | Needs soft delete + partial unique index. Good standalone exercise later. |
| Soft delete (`deletedAt`) | Deferred **on purpose** — I want to write that migration myself as a learning exercise. |
| Bus Operator as a user role | No functional requirement uses it yet. Don't put unused roles in the schema. |
| Notifications / email | Needs a provider, adds nothing to the schema story. |
| OTP login | Needs an SMS provider, costs money, adds a whole flow. |
| Admin CRUD APIs | Seeding covers it for now. |
| Observability | Would use OpenTelemetry + Jaeger so it works with Datadog later. |
| `createdBy` / `version` columns | Not needed yet. |
| Frontend | Manager said "web can be done at the end". |

> Cut scope that's **documented** reads as planning. Cut scope that's **silent** reads as failure.

---

## 3. Functional requirements

**Customer**

1. Register and log in (email + password)
2. Search buses by pickup city + drop city + travel date
3. Filter/choose by departure time, bus type, operator
4. View seat map and select specific seats
5. Enter passenger details per seat (name, age, gender)
6. Pay — mock. Statuses: UNPAID, PAID, FAILED, CANCELLED
7. View booking history

**Admin**

1. Add operators, buses, seats, cities, routes, trips
2. (Phase 1: done via seed script, not APIs)

**Roles:** `USER` and `ADMIN` only for now.

---

## 4. Non-functional requirements

| # | Requirement | How it's met |
|---|---|---|
| 1 | **Correctness** — a seat can never be sold twice, even under concurrent requests | `UNIQUE (trip_id, seat_id)` on `booking_seats` + DB transaction |
| 2 | **Data integrity** — rules enforced at DB level, not just in code | FKs on every relation, unique constraints, enums, CHECK on age |
| 3 | **Maintainability** — readable, extendable | Feature-based modules, DTO validation on every input, migrations not `synchronize` |
| 4 | **Performance** — search stays fast as data grows | Index on `(route_id, departure_time)` + indexes on queried FKs |
| 5 | **Security** | Passwords bcrypt-hashed, JWT-guarded routes, users see only their own bookings |

Functional = *what* it does. Non-functional = *how well* it does it.
NFR #1 is really the whole project.

---

## 5. The key insight: Trip, not Bus

Bus KA-01-1234 runs Bangalore→Chennai tonight at 22:00.
Tomorrow it runs Chennai→Bangalore at 21:00.

**When I book seat 12, what am I booking?** Not the bus — the bus does many journeys.

A **Trip** = a specific bus, on a specific route, departing at a specific date and time.
That is what a Booking points at.

Beginners book against the Bus, and the schema falls apart the moment the same bus runs twice.

Related: I originally had `weekday` on Trip. Removed — that implies a recurring schedule, and you
can't book a seat on "every Monday." Recurring schedules would be a separate `Schedule` entity that
*generates* Trips. Out of scope.

---

## 6. Availability is derived, never stored

Tempting: put `isAvailable` boolean on `seats`.

**Why that's wrong:** seat 12 on bus KA-01-1234 is booked on tonight's trip and free on tomorrow's.
One boolean cannot hold two different truths. Availability isn't a property of the seat — it's a
property of the **(trip, seat) pair**.

So it isn't stored. It's derived:

> Seat 12 is free on Trip 45 if no `booking_seats` row exists for trip 45 + seat 12.

The booking rows **are** the availability data. One source of truth, can't drift.

There's a worse failure mode with a flag: if the app crashes between "insert booking" and "update
flag", a sold seat is marked free. Derived data has no such gap.

**Same reasoning removed `maxSeats` from Bus.** The count is `SELECT COUNT(*) FROM seats WHERE bus_id = ?`.
Storing it means it can drift — seed inserts 38 seats but the column says 40, and now the search page
says "2 seats left" while the seat map shows none. Nobody knows which is lying.

> Rule: if a value can be computed from other rows, don't store it.
> (Storing it deliberately for speed is called **denormalisation** — only done after measuring a real
> problem, and it costs maintenance.)

---

## 7. The hard problem: double booking

Two users click seat 12 at the same millisecond.

**Without protection:** both requests query "is seat 12 free?", both get "yes", both insert.
Seat sold twice. A code-level check cannot win this race — there's always a gap between the check
and the insert.

**The fix, three layers:**

1. **`UNIQUE (trip_id, seat_id)`** on `booking_seats` — the database refuses the second insert.
   Both requests try; Postgres accepts the first and **rejects** the second. My code catches that
   error and tells user 2 to pick another seat.
2. **A transaction** wrapping the check and the insert, so a partial booking can never be left behind.
3. **Seat holds with TTL** (deferred) — a HELD booking expiring in ~10 min, so abandoned checkouts
   don't lock seats forever.

**Why the DB and not the code:** the constraint holds no matter how fast requests arrive or how many
app servers are running. The database is the referee.

### Why `trip_id` is duplicated on `booking_seats`

`booking_seats` links to `bookings` and `seats`. The trip is reachable via
`booking_seat → booking → trip`, so `trip_id` looks redundant.

**But a unique constraint can only use columns in its own table.** If `trip_id` lives on `bookings`,
`UNIQUE (trip_id, seat_id)` cannot be written at all, and I'd be stuck with a code-level check that
loses races.

So the duplication is deliberate, bought to make the constraint possible.

---

## 8. Entities

10 tables. All have `created_at` and `updated_at`. No `deleted_at` (deferred, see §2).

| Entity | Purpose |
|---|---|
| `users` | customers + admins |
| `operators` | the bus company (VRL, SRS) |
| `buses` | a physical vehicle, belongs to an operator |
| `seats` | physical seats bolted to a bus |
| `cities` | |
| `routes` | from-city → to-city |
| `trips` | **a bus running a route at a specific date/time** |
| `bookings` | one user booking one trip |
| `booking_seats` | one row per seat booked, holds passenger details |
| `payments` | one row per payment attempt |

### Relationships

```
operators   1:M  buses           buses.operator_id
buses       1:M  seats           seats.bus_id
cities      1:M  routes (from)   routes.from_city_id
cities      1:M  routes (to)     routes.to_city_id
buses       1:M  trips           trips.bus_id
routes      1:M  trips           trips.route_id
users       1:M  bookings        bookings.user_id
trips       1:M  bookings        bookings.trip_id
bookings    1:M  booking_seats   booking_seats.booking_id
seats       1:M  booking_seats   booking_seats.seat_id
trips       1:M  booking_seats   booking_seats.trip_id
bookings    1:M  payments        payments.booking_id
```

Notes:
- **`cities` appears twice on `routes`** — two separate FKs to the same table (from / to). Normal,
  just needs distinct column names.
- **`trips` appears twice** — on `bookings` and on `booking_seats`. The deliberate duplication (§7).
- **`booking_seats` is a join table that grew up.** Booking↔Seat is many-to-many, so it needs a third
  table. But it also carries `passenger_name`, `age`, `gender` — when a join table has its own data,
  it's a real entity, not just plumbing.

**FK rule:** the foreign key always goes on the "many" side. If it went on the "one" side, that column
would need to hold many ids, and columns hold one value.

**Reading trick when unsure:** say it both ways.
*"One bus has many seats. One seat belongs to one bus."* → FK on seat. Done.

---

## 9. Schema (dbdiagram source)

```
Enum user_role { USER ADMIN }
Enum bus_type { AC_SLEEPER NON_AC_SLEEPER AC_SEATER NON_AC_SEATER }
Enum seat_type { SLEEPER SEMI_SLEEPER REGULAR }
Enum deck_type { UPPER LOWER }
Enum trip_status { SCHEDULED DEPARTED COMPLETED CANCELLED }
Enum booking_status { PENDING CONFIRMED CANCELLED }
Enum payment_status { UNPAID PAID FAILED CANCELLED }
Enum gender { MALE FEMALE OTHER }

Table users {
  id integer [pk, increment]
  name varchar(255) [not null]
  email varchar(255) [unique, not null]
  phone varchar(15) [unique, not null, note: 'E.164, stored as +91XXXXXXXXXX']
  password_hash varchar(255) [not null]
  role user_role [not null, default: 'USER']
  created_at timestamp [not null, default: `now()`]
  updated_at timestamp [not null, default: `now()`]
}

Table operators {
  id integer [pk, increment]
  name varchar(255) [not null]
  contact_email varchar(255) [not null]
  is_active boolean [not null, default: true]
  created_at timestamp [not null, default: `now()`]
  updated_at timestamp [not null, default: `now()`]
}

Table buses {
  id integer [pk, increment]
  operator_id integer [not null]
  registration_number varchar(20) [unique, not null]
  bus_type bus_type [not null]
  is_active boolean [not null, default: true]
  created_at timestamp [not null, default: `now()`]
  updated_at timestamp [not null, default: `now()`]
}

Table seats {
  id integer [pk, increment]
  bus_id integer [not null]
  seat_number varchar(5) [not null]
  seat_type seat_type [not null]
  deck deck_type [not null]
  created_at timestamp [not null, default: `now()`]
  updated_at timestamp [not null, default: `now()`]

  indexes {
    (bus_id, seat_number) [unique, name: 'uq_bus_seat']
  }
}

Table cities {
  id integer [pk, increment]
  name varchar(100) [not null]
  state varchar(100) [not null]
  created_at timestamp [not null, default: `now()`]
  updated_at timestamp [not null, default: `now()`]

  indexes {
    (name, state) [unique, name: 'uq_city_name_state']
  }
}

Table routes {
  id integer [pk, increment]
  from_city_id integer [not null]
  to_city_id integer [not null]
  distance_km integer [not null]
  duration_minutes integer [not null]
  created_at timestamp [not null, default: `now()`]
  updated_at timestamp [not null, default: `now()`]

  indexes {
    (from_city_id, to_city_id) [unique, name: 'uq_route_cities']
  }
}

Table trips {
  id integer [pk, increment]
  bus_id integer [not null]
  route_id integer [not null]
  departure_time timestamp [not null]
  arrival_time timestamp [not null]
  fare decimal(10,2) [not null]
  status trip_status [not null, default: 'SCHEDULED']
  created_at timestamp [not null, default: `now()`]
  updated_at timestamp [not null, default: `now()`]

  indexes {
    (route_id, departure_time) [name: 'idx_trip_route_departure']
  }
}

Table bookings {
  id integer [pk, increment]
  user_id integer [not null]
  trip_id integer [not null]
  status booking_status [not null, default: 'PENDING']
  total_amount decimal(10,2) [not null]
  created_at timestamp [not null, default: `now()`]
  updated_at timestamp [not null, default: `now()`]

  indexes {
    (user_id) [name: 'idx_booking_user']
  }
}

Table booking_seats {
  id integer [pk, increment]
  booking_id integer [not null]
  trip_id integer [not null]
  seat_id integer [not null]
  passenger_name varchar(100) [not null]
  age integer [not null, note: 'CHECK age > 0 AND age < 120']
  gender gender [not null]
  created_at timestamp [not null, default: `now()`]
  updated_at timestamp [not null, default: `now()`]

  indexes {
    (trip_id, seat_id) [unique, name: 'uq_trip_seat']
  }
}

Table payments {
  id integer [pk, increment]
  booking_id integer [not null]
  amount decimal(10,2) [not null]
  status payment_status [not null, default: 'UNPAID']
  transaction_ref varchar(100)
  paid_at timestamp
  created_at timestamp [not null, default: `now()`]
  updated_at timestamp [not null, default: `now()`]

  indexes {
    (booking_id) [name: 'idx_payment_booking']
  }
}

Ref: buses.operator_id > operators.id
Ref: seats.bus_id > buses.id
Ref: routes.from_city_id > cities.id
Ref: routes.to_city_id > cities.id
Ref: trips.bus_id > buses.id
Ref: trips.route_id > routes.id
Ref: bookings.user_id > users.id
Ref: bookings.trip_id > trips.id
Ref: booking_seats.booking_id > bookings.id
Ref: booking_seats.trip_id > trips.id
Ref: booking_seats.seat_id > seats.id
Ref: payments.booking_id > bookings.id
```

---

## 10. Column-level decisions

### Naming

`snake_case` in the database (Postgres convention), `camelCase` in TypeScript entities.
TypeORM maps between them. Consistency matters more than which one.

### `password_hash`, not `password`

Naming that makes it obvious plaintext is never stored. Reviewers notice.

### `phone` — E.164

E.164 is the international standard: `+` then country code then number, no spaces or dashes, max 15 digits.
`+919876543210` → `+91` is India.

**Why it matters:** `9876543210` and `+91 98765 43210` are the same phone but different strings —
the unique constraint would let both in.

**Plan:** UI accepts 10 digits, service prepends `+91` before saving.

```ts
const phone = '+91' + dto.phone;   // dto.phone is 10 digits
```

Going international later changes that constant into a request value. **No migration, no new database,
no new servers** — country is just data, `+91...` and `+1...` sit in the same column.
(Splitting databases by country only happens for legal **data residency** requirements.)

### Money: `decimal(10,2)`, never `float`

`integer` can't store ₹450.50. `float` causes rounding bugs — classic money mistake.
Alternative would be storing paise as an integer (45050). Picked decimal for readability.

### `seat_number` is `varchar(5)`, not integer

Real seats are "A1", "L12", "U3" — not numbers.

### Enums over varchar

`varchar` would accept `"adminn"`. Enums make invalid values impossible at the DB level.
Same reasoning as NFR #2 — enforce in the database, not just in code.

### Status enum over boolean

`is_active` gets painful the moment a third state appears ("suspended").
Prefer a status enum wherever more than two states are plausible.

### `paid_at` even though `created_at`/`updated_at` exist

`created_at` / `updated_at` are **technical** — when the row was touched. `updated_at` changes on
*any* edit, including a typo fix on the transaction ref.

`paid_at` is a **business fact** — the moment money was received. Needed for receipts and reports.
It also carries meaning when null: never paid. `created_at` can't express that.

### `id` as integer, not UUID

Simpler to debug. UUID's advantages (don't leak row counts, can generate before insert) don't matter here.

---

## 11. Indexes

### unique vs index

- **unique** = a *rule*. Postgres builds an index automatically to enforce it — that's *how* it checks.
- **index** = *speed only*, no rule.

**So `email` and `phone` are already indexed** by being unique. Adding a separate index would be
duplicate work and wasted disk.

Only write a separate index for columns that are **not** unique.

### Indexes I added, and why

| Index | Why |
|---|---|
| `(bus_id, seat_number)` unique | no two seats "A1" on the same bus |
| `(name, state)` unique on cities | stops seed scripts creating duplicate cities |
| `(from_city_id, to_city_id)` unique on routes | stops duplicate Bangalore→Chennai routes, which would make search return the same journey twice |
| `(route_id, departure_time)` on trips | **the search index** — matches `WHERE route_id = ? AND departure_time BETWEEN ...` |
| `(trip_id, seat_id)` unique on booking_seats | **the correctness constraint** |
| `(user_id)` on bookings | "my bookings" — without it, `WHERE user_id = 42` reads *every* row (sequential scan) |
| `(booking_id)` on payments | same reason |

### Mistake I caught

I first made `(route_id, departure_time)` **unique**. Wrong — that would mean only one bus can ever
run Bangalore→Chennai at 22:00. Real operators run several. It's a speed index, not a rule.

> Lesson: before adding `unique`, ask "is this genuinely impossible in the real world?"

### Gap to fix

**Postgres does not auto-index foreign keys** (MySQL does — common gotcha). These FKs get queried but
have no index yet:

- `seats.bus_id` — every seat map load
- `trips.bus_id`, `trips.route_id`
- `booking_seats.booking_id`, `booking_seats.seat_id`
- `routes.from_city_id`, `routes.to_city_id`

Note `booking_seats.trip_id` **is** already covered — it's the leading column of `uq_trip_seat`, and a
multi-column index also serves queries on its first column.

**Cost of indexes:** every one slows writes and uses disk. Index what you actually query, not everything.

---

## 12. Payments: one row per attempt

**Open decision — pick one and note it:**

**Option A — one payment row, status changes** (`UNPAID → FAILED → PAID`)
Simple. `booking_id` becomes `[unique]` (and the separate index goes away).
But history is lost — you know it eventually succeeded, not that it failed twice first.

**Option B — one row per attempt** ← leaning this way

```
id 1 | booking 5 | FAILED
id 2 | booking 5 | FAILED
id 3 | booking 5 | PAID
```

Real payment systems do this: each attempt has its own gateway transaction ref, timestamp, and failure
reason. Needed for reconciliation and for "why was I charged twice?"

The schema already leans this way — `transaction_ref` is per-attempt data.

**Trade-off:** "is this booking paid?" is no longer one column. It becomes "does a PAID payment exist
for this booking?"

**Guardrail** — prevents double-charging while still allowing failed attempts:

```sql
CREATE UNIQUE INDEX uq_one_successful_payment
ON payments (booking_id)
WHERE status = 'PAID';
```

---

## 13. Partial indexes (technique to remember)

A unique constraint that applies to **only some rows**:

```sql
CREATE UNIQUE INDEX name ON table (cols) WHERE condition;
```

Two places this project needs it:

**1. The payment guardrail** above.

**2. When soft delete is added later.** A soft-deleted `booking_seats` row still occupies
`(trip 45, seat 12)`, so nobody could ever rebook that seat. Fix:

```sql
CREATE UNIQUE INDEX uq_active_trip_seat
ON booking_seats (trip_id, seat_id)
WHERE deleted_at IS NULL;
```

= *trip + seat must be unique, but only counting rows that aren't deleted.*

TypeORM decorators won't generate partial indexes — they must be hand-written in a migration.
That migration (add `deleted_at`, drop the plain constraint, rebuild it as partial) is exactly the
learning exercise I deferred it for.

---

## 14. Open questions for manager

- [ ] Is 3-4 days calendar time, or 3-4 days of my time spread out? Alongside normal work or instead of it?
- [ ] Payments: one row per attempt, or one row with changing status?
- [ ] Should admin CRUD APIs exist, or is seeding enough for now?
- [ ] Testing expectations — unit, e2e, or none?
- [ ] Deploy somewhere, or is running locally enough?
- [ ] Should I match our existing repo conventions (folder structure, lint config)?
- [ ] Can we do a short weekly review rather than only a final demo?
- [ ] **What would a strong outcome look like to you?**

---

## 15. Talking points for the 1-1

Things to raise **unprompted** — these are what show engineering thinking:

1. **"A booking is against a Trip, not a Bus"** — and why (§5)
2. **"Availability is derived, not stored"** — and the `isAvailable` trap (§6)
3. **"Two people clicking the same seat"** — the DB constraint is the referee, not my code (§7)
4. **"`trip_id` is duplicated on purpose"** — a unique constraint can only use columns in its own table (§7)
5. **"`synchronize: false`, using migrations"** — auto-sync silently drops columns with data in them
6. **"Deferred soft delete on purpose"** — because retrofitting it onto a table with a unique constraint
   is a real migration, and I want to write it
7. **"Chose TypeORM over Sequelize"** — TypeScript-native, decorator-based, official Nest module.
   (We use both at work, on separate connections — I only need one.)
8. **"Deferred observability"** — would use OpenTelemetry so it works with Datadog later

---

## 16. Next steps

**Phase 1 build order:**

1. Entities (start with leaf tables that depend on nothing: `City`, `Operator`, `User`)
2. Migration config + first migration — hand-add the age CHECK and any partial index
3. Seed script — cities, operators, buses, seats, routes, trips

Then Phase 2 (auth) → Phase 3 (search) → Phase 4 (seat map) → Phase 5 (booking + transaction).
