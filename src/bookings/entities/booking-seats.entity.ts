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
import { Gender } from '../enums/gender.enum';
import { Booking } from './booking.entity';
import { Trip } from '../../trips/entities/trip.entity';
import { Seat } from '../../buses/entities/seat.entity';

@Entity('booking_seats')
@Check('check_valid_age', 'age > 0 and age < 100')
@Index('uq_trip_seat', ['tripId', 'seatId'], { unique: true })
export class BookingSeat extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Booking)
  @JoinColumn({ name: 'booking_id' })
  booking: Booking;

  @Column({ name: 'booking_id' })
  bookingId: number;

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

  @Column({ length: 255, name: 'passenger_name' })
  passengerName: string;

  @Column()
  age: number;

  @Column({ type: 'enum', enum: Gender, nullable: true })
  gender: Gender;
}
