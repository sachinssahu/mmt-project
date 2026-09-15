/**
 * Seeds the database from SCHEMA.md section 7.
 *
 * Run with:  npm run seed
 *
 * Safe to re-run: every table is truncated first, and the whole thing runs in
 * one transaction, so you either get the complete dataset or the database is
 * left exactly as it was. A half-seeded database is worse than an empty one
 * because you cannot tell what is missing.
 */

import * as bcrypt from 'bcrypt';
import {
  EntityManager,
  EntityTarget,
  ObjectLiteral,
  QueryDeepPartialEntity,
} from 'typeorm';
import dataSource from '../../data-source';

import { User } from '../../users/entities/user.entity';
import { Operator } from '../../operators/entities/operator.entity';
import { Bus } from '../../buses/entities/bus.entity';
import { Seat } from '../../buses/entities/seat.entity';
import { City } from '../../cities/entities/city.entity';
import { Stop } from '../../stops/entities/stop.entity';
import { Route } from '../../routes/entities/route.entity';
import { RouteStop } from '../../routes/entities/route-stop.entity';
import { RouteFare } from '../../routes/entities/route-fare.entity';
import { Trip } from '../../trips/entities/trip.entity';
import { TripStop } from '../../trips/entities/trip-stop.entity';
import { Booking } from '../../bookings/entities/booking.entity';
import { Passenger } from '../../bookings/entities/passenger.entity';
import { BookingLeg } from '../../bookings/entities/booking-leg.entity';
import { SeatBooking } from '../../bookings/entities/seat-booking.entity';
import { Payment } from '../../payments/entities/payment.entity';

import { buildTripStops } from '../../trips/trip-stops.builder';
import * as data from './seed-data';

/**
 * Truncated in reverse FK order. CASCADE handles the rest, RESTART IDENTITY
 * rewinds each sequence to 1 (which resetSequences() then corrects, since the
 * rows below carry explicit ids).
 */
const TABLES = [
  'payments',
  'seat_bookings',
  'booking_legs',
  'passengers',
  'bookings',
  'trip_stops',
  'trips',
  'route_fares',
  'route_stops',
  'routes',
  'stops',
  'cities',
  'seats',
  'buses',
  'operators',
  'users',
];

/**
 * Inserts rows while honouring explicit primary keys.
 *
 * manager.insert() silently DROPS any column whose generationStrategy is
 * "increment" - see InsertQueryBuilder.getInsertedColumns(). It assumes you
 * want the sequence to assign ids, so `{ id: 100, ... }` inserts as id 1.
 *
 * Passing an explicit column list to into() switches that filter off: when
 * insertColumns is non-empty, TypeORM inserts exactly the columns named. The
 * list is derived from the first row, so a batch without an `id` key still
 * lets the sequence do its job (route_stops, route_fares, trip_stops).
 */
async function insertRows<T extends ObjectLiteral>(
  mgr: EntityManager,
  entity: EntityTarget<T>,
  rows: QueryDeepPartialEntity<T>[],
): Promise<void> {
  if (rows.length === 0) return;

  await mgr
    .createQueryBuilder()
    .insert()
    .into(entity, Object.keys(rows[0] as object))
    .values(rows)
    .execute();
}

async function truncateAll(mgr: EntityManager): Promise<void> {
  await mgr.query(
    `TRUNCATE TABLE ${TABLES.map((t) => `"${t}"`).join(', ')} RESTART IDENTITY CASCADE`,
  );
}

/**
 * Explicit ids do not advance a SERIAL sequence, so without this the first real
 * booking would try to take id 1 and eventually collide with the seeded rows.
 *
 * The third setval argument is is_called: true means "next id is this + 1"
 * (correct after seeding), false means "next id is exactly this" (correct for
 * an empty table). COALESCE + IS NOT NULL picks the right one automatically.
 */
async function resetSequences(mgr: EntityManager): Promise<void> {
  for (const table of TABLES) {
    await mgr.query(
      `SELECT setval(
         pg_get_serial_sequence('"${table}"', 'id'),
         COALESCE(MAX(id), 1),
         MAX(id) IS NOT NULL
       ) FROM "${table}"`,
    );
  }
}

function buildRouteStops() {
  const rows: Partial<RouteStop>[] = [];

  for (const [routeId, stops] of Object.entries(data.ROUTE_STOPS)) {
    const lastSeq = stops[stops.length - 1][0];

    for (const [
      seq,
      stopId,
      arrivalOffsetMin,
      departureOffsetMin,
      km,
    ] of stops) {
      rows.push({
        routeId: Number(routeId),
        stopId,
        seq,
        arrivalOffsetMin,
        departureOffsetMin,
        distanceFromOriginKm: km,
        // You cannot board at the destination, or alight at the origin.
        boardingAllowed: seq !== lastSeq,
        droppingAllowed: seq !== 0,
      });
    }
  }
  return rows;
}

function buildRouteFares() {
  const rows: Partial<RouteFare>[] = [];

  for (const [routeId, fares] of Object.entries(data.ROUTE_FARES)) {
    for (const [fromSeq, toSeq, baseFare] of fares) {
      rows.push({ routeId: Number(routeId), fromSeq, toSeq, baseFare });
    }
  }
  return rows;
}

async function seed(mgr: EntityManager): Promise<void> {
  await truncateAll(mgr);

  // Hash once - bcrypt is deliberately slow, and all seeded users share a password.
  const passwordHash = await bcrypt.hash(data.SEED_PASSWORD, 10);

  // --- Identity + static layer (no row here depends on a date) ---
  await insertRows(
    mgr,
    User,
    data.USERS.map((u) => ({ ...u, passwordHash })),
  );
  await insertRows(mgr, Operator, data.OPERATORS);
  await insertRows(mgr, Bus, data.BUSES);
  await insertRows(mgr, Seat, data.SEATS);
  await insertRows(mgr, City, data.CITIES);
  await insertRows(mgr, Stop, data.STOPS);

  // --- Schedule layer: plan (undated) then instance (dated) ---
  await insertRows(mgr, Route, data.ROUTES);
  await insertRows(mgr, RouteStop, buildRouteStops());
  await insertRows(mgr, RouteFare, buildRouteFares());

  await insertRows(
    mgr,
    Trip,
    data.TRIPS.map((t) => ({
      ...t,
      baseDepartureAt: new Date(t.baseDepartureAt),
    })),
  );

  // trip_stops are derived, never transcribed - same function the trip
  // generation endpoint will use in phase 2.
  const tripStops = data.TRIPS.flatMap((trip) =>
    buildTripStops(
      trip.id,
      new Date(trip.baseDepartureAt),
      data.ROUTE_STOPS[trip.routeId].map(
        ([seq, stopId, arrivalOffsetMin, departureOffsetMin]) => ({
          seq,
          stopId,
          arrivalOffsetMin,
          departureOffsetMin,
        }),
      ),
    ),
  );
  await insertRows(mgr, TripStop, tripStops);

  // --- Transaction layer ---
  await insertRows(
    mgr,
    Booking,
    data.BOOKINGS.map((b) => ({ ...b, holdExpiresAt: null })),
  );
  await insertRows(mgr, Passenger, data.PASSENGERS);
  await insertRows(mgr, BookingLeg, data.BOOKING_LEGS);
  await insertRows(mgr, SeatBooking, data.SEAT_BOOKINGS);
  await insertRows(
    mgr,
    Payment,
    data.PAYMENTS.map((p) => ({
      ...p,
      paidAt: p.paidAt ? new Date(p.paidAt) : null,
    })),
  );

  await resetSequences(mgr);
}

async function main(): Promise<void> {
  await dataSource.initialize();
  try {
    await dataSource.transaction(seed);
    console.log('seed complete');
    console.log(`  users            ${data.USERS.length}`);
    console.log(`  seats            ${data.SEATS.length}`);
    console.log(`  stops            ${data.STOPS.length}`);
    console.log(`  route_stops      ${buildRouteStops().length}`);
    console.log(`  route_fares      ${buildRouteFares().length}`);
    console.log(`  trips            ${data.TRIPS.length}`);
    console.log(`  bookings         ${data.BOOKINGS.length}`);
    console.log(`  seat_bookings    ${data.SEAT_BOOKINGS.length}`);
  } finally {
    await dataSource.destroy();
  }
}

main().catch((err) => {
  console.error('seed failed:', err);
  process.exit(1);
});
