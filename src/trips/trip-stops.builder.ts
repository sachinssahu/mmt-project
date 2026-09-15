/**
 * Resolves a route template into absolute trip_stops rows for one run.
 *
 * This is the same calculation POST /admin/trips/generate will need in phase 2,
 * so it lives here as a pure function rather than inside the seed script - no
 * database access, no NestJS decorators, trivially unit-testable.
 */

export interface RouteStopTemplate {
  stopId: number;
  seq: number;
  arrivalOffsetMin: number;
  departureOffsetMin: number;
}

export interface GeneratedTripStop {
  tripId: number;
  stopId: number;
  seq: number;
  arrivalAt: Date | null;
  departureAt: Date | null;
  isSkipped: boolean;
}

function addMinutes(base: Date, minutes: number): Date {
  return new Date(base.getTime() + minutes * 60_000);
}

/**
 * @param tripId        the trip these stops belong to
 * @param baseDepartureAt departure from seq 0 - every other time derives from it
 * @param routeStops    the route template, any order; sorted internally
 * @returns one row per route stop, ordered by seq
 *
 * arrivalAt is null at seq 0 and departureAt is null at the final seq, because
 * the origin has no arrival and the destination has no departure. Note this is
 * NOT how a skipped stop is represented - that is the is_skipped flag, because
 * null here already means "end of the line".
 */
export function buildTripStops(
  tripId: number,
  baseDepartureAt: Date,
  routeStops: RouteStopTemplate[],
): GeneratedTripStop[] {
  const ordered = [...routeStops].sort((a, b) => a.seq - b.seq);
  const lastSeq = ordered[ordered.length - 1].seq;

  return ordered.map((rs) => ({
    tripId,
    stopId: rs.stopId,
    seq: rs.seq,
    arrivalAt:
      rs.seq === 0 ? null : addMinutes(baseDepartureAt, rs.arrivalOffsetMin),
    departureAt:
      rs.seq === lastSeq
        ? null
        : addMinutes(baseDepartureAt, rs.departureOffsetMin),
    isSkipped: false,
  }));
}
