/**
 * Raw seed data, transcribed from SCHEMA.md section 7.
 *
 * Explicit ids are used throughout so the verification queries in section 8
 * (which reference trip 1, seat 1, pnr MMT5E5, ...) work verbatim. Because
 * explicit ids do not advance a SERIAL sequence, seed.ts resets every sequence
 * at the end - see resetSequences().
 */

import { UserRole } from '../../users/enums/user-role.enum';
import { BusType } from '../../buses/enums/bus-type.enum';
import { SeatType } from '../../buses/enums/seat-type.enum';
import { DeckType } from '../../buses/enums/deck-type.enum';
import { RouteDirection } from '../../routes/enums/route-direction.enum';
import { TripStatus } from '../../trips/enums/trip-status.enum';
import { BookingStatus } from '../../bookings/enums/booking-status.enum';
import { LegStatus } from '../../bookings/enums/leg-status.enum';
import { SeatBookingStatus } from '../../bookings/enums/seat-booking-status.enum';
import { Gender } from '../../bookings/enums/gender.enum';
import { PaymentStatus } from '../../payments/enums/payment-status.enum';

/** Plain-text password for every seeded user. Hashed once in seed.ts. */
export const SEED_PASSWORD = 'Password@123';

/**
 * All seeded timestamps are IST. Writing the offset explicitly matters:
 * `new Date('2026-10-01T18:00:00')` is parsed in the *machine's* timezone, so
 * the same seed would produce different absolute moments on different laptops.
 * timestamptz stores an instant, so the literal has to name its zone.
 */
export const IST = '+05:30';

export const USERS = [
  {
    id: 1,
    name: 'user1',
    email: 'user1@x.com',
    phone: '+919000000001',
    role: UserRole.USER,
  },
  {
    id: 2,
    name: 'user2',
    email: 'user2@x.com',
    phone: '+919000000002',
    role: UserRole.USER,
  },
  {
    id: 3,
    name: 'user3',
    email: 'user3@x.com',
    phone: '+919000000003',
    role: UserRole.USER,
  },
  {
    id: 4,
    name: 'user4',
    email: 'user4@x.com',
    phone: '+919000000004',
    role: UserRole.USER,
  },
  {
    id: 5,
    name: 'user5',
    email: 'user5@x.com',
    phone: '+919000000005',
    role: UserRole.USER,
  },
  {
    id: 100,
    name: 'admin1',
    email: 'admin1@x.com',
    phone: '+919111100001',
    role: UserRole.ADMIN,
  },
  {
    id: 101,
    name: 'admin2',
    email: 'admin2@x.com',
    phone: '+919111100002',
    role: UserRole.ADMIN,
  },
];

export const OPERATORS = [
  {
    id: 1,
    name: 'Operator1 Travels',
    contactEmail: 'ops@operator1.com',
    createdByUserId: 100,
  },
  {
    id: 2,
    name: 'Operator2 Roadways',
    contactEmail: 'ops@operator2.com',
    createdByUserId: 101,
  },
];

export const BUSES = [
  {
    id: 1,
    operatorId: 1,
    registrationNumber: 'DL01AB1111',
    busType: BusType.AC_SLEEPER,
  },
  {
    id: 2,
    operatorId: 2,
    registrationNumber: 'UP32CD2222',
    busType: BusType.AC_SLEEPER,
  },
];

/**
 * Seats are generated rather than listed - 65 near-identical rows is exactly
 * the kind of data a loop should produce.
 *
 * Bus 1: 30 all-sleeper seats. Bus 2 is mixed - semi-sleeper lower deck, full
 * sleeper upper deck - which is the reason seat_type is a per-seat column.
 */
function buildSeats() {
  const seats: {
    id: number;
    busId: number;
    seatNumber: string;
    deck: DeckType;
    seatType: SeatType;
  }[] = [];

  const decks = [
    {
      busId: 1,
      startId: 1,
      count: 15,
      prefix: 'L',
      deck: DeckType.LOWER,
      seatType: SeatType.SLEEPER,
    },
    {
      busId: 1,
      startId: 16,
      count: 15,
      prefix: 'U',
      deck: DeckType.UPPER,
      seatType: SeatType.SLEEPER,
    },
    {
      busId: 2,
      startId: 31,
      count: 20,
      prefix: 'L',
      deck: DeckType.LOWER,
      seatType: SeatType.SEMI_SLEEPER,
    },
    {
      busId: 2,
      startId: 51,
      count: 15,
      prefix: 'U',
      deck: DeckType.UPPER,
      seatType: SeatType.SLEEPER,
    },
  ];

  for (const d of decks) {
    for (let i = 0; i < d.count; i++) {
      seats.push({
        id: d.startId + i,
        busId: d.busId,
        seatNumber: `${d.prefix}${i + 1}`,
        deck: d.deck,
        seatType: d.seatType,
      });
    }
  }
  return seats;
}

export const SEATS = buildSeats();

export const CITIES = [
  { id: 1, name: 'Delhi', state: 'Delhi' },
  { id: 2, name: 'Jaipur', state: 'Rajasthan' },
  { id: 3, name: 'Ahmedabad', state: 'Gujarat' },
  { id: 4, name: 'Indore', state: 'Madhya Pradesh' },
  { id: 5, name: 'Pune', state: 'Maharashtra' },
  { id: 6, name: 'Goa', state: 'Goa' },
  { id: 7, name: 'Bangalore', state: 'Karnataka' },
  { id: 8, name: 'Lucknow', state: 'Uttar Pradesh' },
  { id: 9, name: 'Raipur', state: 'Chhattisgarh' },
  { id: 10, name: 'Nagpur', state: 'Maharashtra' },
  { id: 11, name: 'Hyderabad', state: 'Telangana' },
];

export const STOPS = [
  {
    id: 11,
    cityId: 1,
    name: 'Kashmere Gate ISBT',
    address: 'Kashmere Gate, Delhi',
  },
  {
    id: 12,
    cityId: 1,
    name: 'Anand Vihar ISBT',
    address: 'Anand Vihar, Delhi',
  },
  { id: 13, cityId: 1, name: 'Dhaula Kuan', address: 'Dhaula Kuan, Delhi' },
  { id: 21, cityId: 2, name: 'Sindhi Camp', address: 'Sindhi Camp, Jaipur' },
  {
    id: 22,
    cityId: 2,
    name: 'Narayan Singh Circle',
    address: 'Narayan Singh Circle, Jaipur',
  },
  { id: 23, cityId: 2, name: 'Durgapura', address: 'Durgapura, Jaipur' },
  {
    id: 31,
    cityId: 3,
    name: 'Geeta Mandir',
    address: 'Geeta Mandir, Ahmedabad',
  },
  { id: 32, cityId: 3, name: 'Paldi', address: 'Paldi, Ahmedabad' },
  { id: 33, cityId: 3, name: 'Naroda', address: 'Naroda, Ahmedabad' },
  { id: 41, cityId: 4, name: 'Sarwate Bus Stand', address: 'Sarwate, Indore' },
  { id: 42, cityId: 4, name: 'Vijay Nagar', address: 'Vijay Nagar, Indore' },
  { id: 43, cityId: 4, name: 'Navlakha', address: 'Navlakha, Indore' },
  { id: 51, cityId: 5, name: 'Swargate', address: 'Swargate, Pune' },
  { id: 52, cityId: 5, name: 'Shivajinagar', address: 'Shivajinagar, Pune' },
  { id: 53, cityId: 5, name: 'Wakad', address: 'Wakad, Pune' },
  {
    id: 61,
    cityId: 6,
    name: 'Panjim Kadamba',
    address: 'Kadamba Bus Stand, Panjim, Goa',
  },
  {
    id: 62,
    cityId: 6,
    name: 'Margao KTC',
    address: 'KTC Bus Stand, Margao, Goa',
  },
  {
    id: 71,
    cityId: 7,
    name: 'Majestic (KBS)',
    address: 'Kempegowda Bus Station, Bangalore',
  },
  { id: 72, cityId: 7, name: 'Madiwala', address: 'Madiwala, Bangalore' },
  { id: 73, cityId: 7, name: 'Hebbal', address: 'Hebbal, Bangalore' },
  { id: 81, cityId: 8, name: 'Alambagh', address: 'Alambagh, Lucknow' },
  { id: 82, cityId: 8, name: 'Charbagh', address: 'Charbagh, Lucknow' },
  { id: 91, cityId: 9, name: 'Pandri Bus Stand', address: 'Pandri, Raipur' },
  { id: 92, cityId: 9, name: 'Telibandha', address: 'Telibandha, Raipur' },
  { id: 101, cityId: 10, name: 'Ganeshpeth', address: 'Ganeshpeth, Nagpur' },
  { id: 102, cityId: 10, name: 'Wardha Road', address: 'Wardha Road, Nagpur' },
  {
    id: 111,
    cityId: 11,
    name: 'MGBS',
    address: 'Mahatma Gandhi Bus Station, Hyderabad',
  },
  { id: 112, cityId: 11, name: 'Miyapur', address: 'Miyapur, Hyderabad' },
];

export const ROUTES = [
  {
    id: 1,
    operatorId: 1,
    name: 'Delhi-BLR via Pune',
    fromCityId: 1,
    toCityId: 7,
    serviceGroup: 'OP1-DEL-BLR',
    direction: RouteDirection.ONWARD,
  },
  {
    id: 2,
    operatorId: 2,
    name: 'Delhi-BLR via Raipur',
    fromCityId: 1,
    toCityId: 7,
    serviceGroup: 'OP2-DEL-BLR',
    direction: RouteDirection.ONWARD,
  },
  {
    id: 3,
    operatorId: 1,
    name: 'BLR-Delhi via Pune',
    fromCityId: 7,
    toCityId: 1,
    serviceGroup: 'OP1-DEL-BLR',
    direction: RouteDirection.RETURN,
  },
  {
    id: 4,
    operatorId: 2,
    name: 'BLR-Delhi via Raipur',
    fromCityId: 7,
    toCityId: 1,
    serviceGroup: 'OP2-DEL-BLR',
    direction: RouteDirection.RETURN,
  },
];

/**
 * [seq, stopId, arrivalOffsetMin, departureOffsetMin, distanceFromOriginKm]
 *
 * boarding_allowed is false only at the final stop, dropping_allowed false only
 * at the origin - derived in buildRouteStops() rather than repeated 28 times.
 */
export const ROUTE_STOPS: Record<
  number,
  [number, number, number, number, number][]
> = {
  1: [
    [0, 11, 0, 0, 0],
    [1, 21, 300, 320, 280],
    [2, 31, 900, 945, 950],
    [3, 41, 1320, 1350, 1350],
    [4, 51, 1920, 1950, 1930],
    [5, 61, 2280, 2325, 2380],
    [6, 71, 2760, 2760, 2950],
  ],
  2: [
    [0, 12, 0, 0, 0],
    [1, 81, 480, 525, 510],
    [2, 41, 1305, 1350, 1200],
    [3, 91, 2040, 2085, 1800],
    [4, 101, 2400, 2445, 2050],
    [5, 111, 3000, 3045, 2460],
    [6, 71, 3480, 3480, 3030],
  ],
  3: [
    [0, 71, 0, 0, 0],
    [1, 61, 480, 525, 570],
    [2, 51, 840, 885, 1020],
    [3, 41, 1440, 1470, 1600],
    [4, 31, 1860, 1905, 2000],
    [5, 21, 2460, 2480, 2670],
    [6, 12, 2760, 2760, 2950],
  ],
  4: [
    [0, 71, 0, 0, 0],
    [1, 111, 480, 525, 570],
    [2, 101, 1080, 1125, 980],
    [3, 91, 1440, 1485, 1230],
    [4, 41, 2160, 2205, 1830],
    [5, 81, 2940, 2985, 2520],
    [6, 12, 3420, 3420, 3030],
  ],
};

/**
 * [fromSeq, toSeq, baseFare] - 21 segments per route, C(7,2).
 *
 * These are deliberately NOT additive. Route 1 Delhi->Indore (1800) plus
 * route 2 Indore->BLR (2200) is 4000, against 3500 for the direct trip.
 * Never enforce additivity in code.
 */
export const ROUTE_FARES: Record<number, [number, number, number][]> = {
  1: [
    [0, 1, 450],
    [0, 2, 1300],
    [0, 3, 1800],
    [0, 4, 2500],
    [0, 5, 3000],
    [0, 6, 3500],
    [1, 2, 950],
    [1, 3, 1450],
    [1, 4, 2150],
    [1, 5, 2650],
    [1, 6, 3150],
    [2, 3, 600],
    [2, 4, 1350],
    [2, 5, 1900],
    [2, 6, 2450],
    [3, 4, 850],
    [3, 5, 1400],
    [3, 6, 1950],
    [4, 5, 700],
    [4, 6, 1350],
    [5, 6, 800],
  ],
  2: [
    [0, 1, 550],
    [0, 2, 1250],
    [0, 3, 1900],
    [0, 4, 2150],
    [0, 5, 2600],
    [0, 6, 3200],
    [1, 2, 750],
    [1, 3, 1350],
    [1, 4, 1600],
    [1, 5, 2050],
    [1, 6, 2650],
    [2, 3, 650],
    [2, 4, 900],
    [2, 5, 1350],
    [2, 6, 2200],
    [3, 4, 300],
    [3, 5, 700],
    [3, 6, 1300],
    [4, 5, 450],
    [4, 6, 1050],
    [5, 6, 600],
  ],
  3: [
    [0, 1, 700],
    [0, 2, 1250],
    [0, 3, 1950],
    [0, 4, 2400],
    [0, 5, 3150],
    [0, 6, 3550],
    [1, 2, 550],
    [1, 3, 1250],
    [1, 4, 1700],
    [1, 5, 2500],
    [1, 6, 2850],
    [2, 3, 700],
    [2, 4, 1400],
    [2, 5, 2000],
    [2, 6, 2350],
    [3, 4, 500],
    [3, 5, 1300],
    [3, 6, 1650],
    [4, 5, 800],
    [4, 6, 1150],
    [5, 6, 450],
  ],
  4: [
    [0, 1, 600],
    [0, 2, 1050],
    [0, 3, 1300],
    [0, 4, 1950],
    [0, 5, 2650],
    [0, 6, 3200],
    [1, 2, 450],
    [1, 3, 700],
    [1, 4, 1350],
    [1, 5, 2050],
    [1, 6, 2600],
    [2, 3, 600],
    [2, 4, 900],
    [2, 5, 1600],
    [2, 6, 2150],
    [3, 4, 650],
    [3, 5, 1350],
    [3, 6, 1900],
    [4, 5, 750],
    [4, 6, 1250],
    [5, 6, 550],
  ],
};

export const TRIPS = [
  {
    id: 1,
    routeId: 1,
    busId: 1,
    serviceDate: '2026-10-01',
    baseDepartureAt: `2026-10-01T18:00:00${IST}`,
    status: TripStatus.SCHEDULED,
  },
  {
    id: 2,
    routeId: 2,
    busId: 2,
    serviceDate: '2026-10-01',
    baseDepartureAt: `2026-10-01T20:00:00${IST}`,
    status: TripStatus.SCHEDULED,
  },
  {
    id: 3,
    routeId: 3,
    busId: 1,
    serviceDate: '2026-10-04',
    baseDepartureAt: `2026-10-04T08:00:00${IST}`,
    status: TripStatus.SCHEDULED,
  },
  {
    id: 4,
    routeId: 4,
    busId: 2,
    serviceDate: '2026-10-05',
    baseDepartureAt: `2026-10-05T10:00:00${IST}`,
    status: TripStatus.SCHEDULED,
  },
];

export const BOOKINGS = [
  {
    id: 501,
    userId: 2,
    pnr: 'MMT2A1',
    status: BookingStatus.CONFIRMED,
    totalAmount: 7000,
    isBreakJourney: false,
  },
  {
    id: 502,
    userId: 1,
    pnr: 'MMT1B2',
    status: BookingStatus.CONFIRMED,
    totalAmount: 6400,
    isBreakJourney: false,
  },
  {
    id: 503,
    userId: 3,
    pnr: 'MMT3C3',
    status: BookingStatus.CONFIRMED,
    totalAmount: 600,
    isBreakJourney: false,
  },
  {
    id: 504,
    userId: 4,
    pnr: 'MMT4D4',
    status: BookingStatus.CONFIRMED,
    totalAmount: 1400,
    isBreakJourney: false,
  },
  {
    id: 505,
    userId: 5,
    pnr: 'MMT5E5',
    status: BookingStatus.CONFIRMED,
    totalAmount: 8000,
    isBreakJourney: true,
  },
];

export const PASSENGERS = [
  {
    id: 9001,
    bookingId: 501,
    name: 'user2_passenger1',
    age: 34,
    gender: Gender.MALE,
  },
  {
    id: 9002,
    bookingId: 501,
    name: 'user2_passenger2',
    age: 31,
    gender: Gender.FEMALE,
  },
  {
    id: 9003,
    bookingId: 502,
    name: 'user1_passenger1',
    age: 28,
    gender: Gender.MALE,
  },
  {
    id: 9004,
    bookingId: 502,
    name: 'user1_passenger2',
    age: 26,
    gender: Gender.FEMALE,
  },
  {
    id: 9005,
    bookingId: 503,
    name: 'user3_passenger1',
    age: 45,
    gender: Gender.MALE,
  },
  {
    id: 9006,
    bookingId: 504,
    name: 'user4_passenger1',
    age: 39,
    gender: Gender.FEMALE,
  },
  {
    id: 9007,
    bookingId: 505,
    name: 'user5_passenger1',
    age: 30,
    gender: Gender.MALE,
  },
  {
    id: 9008,
    bookingId: 505,
    name: 'user5_passenger2',
    age: 27,
    gender: Gender.FEMALE,
  },
];

/** Booking 505 is the break journey: two legs, one PNR, one payment. */
export const BOOKING_LEGS = [
  {
    id: 701,
    bookingId: 501,
    tripId: 1,
    legOrder: 1,
    fromSeq: 0,
    toSeq: 6,
    amount: 7000,
    status: LegStatus.CONFIRMED,
  },
  {
    id: 702,
    bookingId: 502,
    tripId: 2,
    legOrder: 1,
    fromSeq: 0,
    toSeq: 6,
    amount: 6400,
    status: LegStatus.CONFIRMED,
  },
  {
    id: 703,
    bookingId: 503,
    tripId: 4,
    legOrder: 1,
    fromSeq: 2,
    toSeq: 3,
    amount: 600,
    status: LegStatus.CONFIRMED,
  },
  {
    id: 704,
    bookingId: 504,
    tripId: 3,
    legOrder: 1,
    fromSeq: 2,
    toSeq: 4,
    amount: 1400,
    status: LegStatus.CONFIRMED,
  },
  {
    id: 705,
    bookingId: 505,
    tripId: 1,
    legOrder: 1,
    fromSeq: 0,
    toSeq: 3,
    amount: 3600,
    status: LegStatus.CONFIRMED,
  },
  {
    id: 706,
    bookingId: 505,
    tripId: 2,
    legOrder: 2,
    fromSeq: 2,
    toSeq: 6,
    amount: 4400,
    status: LegStatus.CONFIRMED,
  },
];

/**
 * Rows 807 and 809 are the same passenger (9007) on two different buses.
 * Rows 807/808 free seats L1/L2 on trip 1 at seq 3, which is what verification
 * query 8.1 proves.
 */
export const SEAT_BOOKINGS = [
  {
    id: 801,
    bookingLegId: 701,
    tripId: 1,
    seatId: 16,
    passengerId: 9001,
    fromSeq: 0,
    toSeq: 6,
    status: SeatBookingStatus.CONFIRMED,
  },
  {
    id: 802,
    bookingLegId: 701,
    tripId: 1,
    seatId: 17,
    passengerId: 9002,
    fromSeq: 0,
    toSeq: 6,
    status: SeatBookingStatus.CONFIRMED,
  },
  {
    id: 803,
    bookingLegId: 702,
    tripId: 2,
    seatId: 51,
    passengerId: 9003,
    fromSeq: 0,
    toSeq: 6,
    status: SeatBookingStatus.CONFIRMED,
  },
  {
    id: 804,
    bookingLegId: 702,
    tripId: 2,
    seatId: 52,
    passengerId: 9004,
    fromSeq: 0,
    toSeq: 6,
    status: SeatBookingStatus.CONFIRMED,
  },
  {
    id: 805,
    bookingLegId: 703,
    tripId: 4,
    seatId: 31,
    passengerId: 9005,
    fromSeq: 2,
    toSeq: 3,
    status: SeatBookingStatus.CONFIRMED,
  },
  {
    id: 806,
    bookingLegId: 704,
    tripId: 3,
    seatId: 3,
    passengerId: 9006,
    fromSeq: 2,
    toSeq: 4,
    status: SeatBookingStatus.CONFIRMED,
  },
  {
    id: 807,
    bookingLegId: 705,
    tripId: 1,
    seatId: 1,
    passengerId: 9007,
    fromSeq: 0,
    toSeq: 3,
    status: SeatBookingStatus.CONFIRMED,
  },
  {
    id: 808,
    bookingLegId: 705,
    tripId: 1,
    seatId: 2,
    passengerId: 9008,
    fromSeq: 0,
    toSeq: 3,
    status: SeatBookingStatus.CONFIRMED,
  },
  {
    id: 809,
    bookingLegId: 706,
    tripId: 2,
    seatId: 53,
    passengerId: 9007,
    fromSeq: 2,
    toSeq: 6,
    status: SeatBookingStatus.CONFIRMED,
  },
  {
    id: 810,
    bookingLegId: 706,
    tripId: 2,
    seatId: 54,
    passengerId: 9008,
    fromSeq: 2,
    toSeq: 6,
    status: SeatBookingStatus.CONFIRMED,
  },
];

/** Booking 504 has a failed attempt then a success - hence no unique on booking_id. */
export const PAYMENTS = [
  {
    id: 601,
    bookingId: 501,
    amount: 7000,
    status: PaymentStatus.PAID,
    transactionRef: 'MANUAL_ABC123',
    paidAt: `2026-09-12T14:03:00${IST}`,
  },
  {
    id: 602,
    bookingId: 502,
    amount: 6400,
    status: PaymentStatus.PAID,
    transactionRef: 'MANUAL_DEF456',
    paidAt: `2026-09-12T15:34:00${IST}`,
  },
  {
    id: 603,
    bookingId: 503,
    amount: 600,
    status: PaymentStatus.PAID,
    transactionRef: 'MANUAL_GHI789',
    paidAt: `2026-09-13T09:02:00${IST}`,
  },
  {
    id: 604,
    bookingId: 504,
    amount: 1400,
    status: PaymentStatus.FAILED,
    transactionRef: 'MANUAL_JKL012',
    paidAt: null,
  },
  {
    id: 605,
    bookingId: 504,
    amount: 1400,
    status: PaymentStatus.PAID,
    transactionRef: 'MANUAL_MNO345',
    paidAt: `2026-09-13T11:05:00${IST}`,
  },
  {
    id: 606,
    bookingId: 505,
    amount: 8000,
    status: PaymentStatus.PAID,
    transactionRef: 'MANUAL_PQR678',
    paidAt: `2026-09-14T10:06:00${IST}`,
  },
];
