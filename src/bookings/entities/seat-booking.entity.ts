import {
  Check,
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { Trip } from '../../trips/entities/trip.entity';
import { Seat } from '../../buses/entities/seat.entity';
import { SeatBookingStatus } from '../enums/seat-booking-status.enum';
import { BookingLeg } from './booking-leg.entity';
import { Passenger } from './passenger.entity';

@Entity('seat_bookings')
@Check('chk_seat_booking_seq_order', 'to_seq > from_seq')
@Index('idx_seat_availability', ['tripId', 'seatId', 'status'])
@Index('idx_seat_booking_leg', ['bookingLegId'])
export class SeatBooking extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => BookingLeg)
  @JoinColumn({ name: 'booking_leg_id' })
  bookingLeg: BookingLeg;

  @Column({ name: 'booking_leg_id' })
  bookingLegId: number;

  @ManyToOne(() => Trip)
  @JoinColumn({ name: 'trip_id' })
  trip: Trip;

  @Column({ name: 'trip_id' })
  tripId: number;

  @ManyToOne(() => Seat)
  @JoinColumn({ name: 'seat_id' })
  seat: Seat;

  @Column({ name: 'seat_id' })
  seatId: number;

  @ManyToOne(() => Passenger)
  @JoinColumn({ name: 'passenger_id' })
  passenger: Passenger;

  @Column({ name: 'passenger_id' })
  passengerId: number;

  @Column({ name: 'from_seq', type: 'smallint' })
  fromSeq: number;

  @Column({ name: 'to_seq', type: 'smallint' })
  toSeq: number;

  @Column({
    type: 'enum',
    enum: SeatBookingStatus,
    default: SeatBookingStatus.HELD,
  })
  status: SeatBookingStatus;
}
