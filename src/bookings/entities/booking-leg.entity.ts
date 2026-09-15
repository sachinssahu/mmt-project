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
import { Booking } from './booking.entity';
import { Trip } from '../../trips/entities/trip.entity';
import { numericTransformer } from '../../common/transformers/numeric.transformer';
import { LegStatus } from '../enums/leg-status.enum';

@Entity('booking_legs')
@Check('chk_leg_seq_order', 'to_seq > from_seq')
@Index('uq_leg_order', ['bookingId', 'legOrder'], { unique: true })
@Index('idx_leg_trip', ['tripId'])
export class BookingLeg extends BaseEntity {
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

  @Column({ name: 'leg_order', type: 'smallint' })
  legOrder: number;

  @Column({ name: 'from_seq', type: 'smallint' })
  fromSeq: number;

  @Column({ name: 'to_seq', type: 'smallint' })
  toSeq: number;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    transformer: numericTransformer,
  })
  amount: number;

  @Column({ type: 'enum', enum: LegStatus, default: LegStatus.PENDING })
  status: LegStatus;
}
