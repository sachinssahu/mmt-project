import {
  Check,
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Booking } from './booking.entity';
import { Gender } from '../enums/gender.enum';
import { BaseEntity } from '../../common/entities/base.entity';

@Entity('passengers')
@Check('chk_passenger_age', 'age > 0 and age < 120')
@Index('idx_passenger_booking_id', ['bookingId'])
export class Passenger extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Booking)
  @JoinColumn({ name: 'booking_id' })
  booking: Booking;

  @Column({ name: 'booking_id' })
  bookingId: number;

  @Column({ length: 255 })
  name: string;

  @Column({ type: 'smallint' })
  age: number;

  @Column({ type: 'enum', enum: Gender })
  gender: Gender;
}
