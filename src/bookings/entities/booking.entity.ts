import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { BookingStatus } from '../enums/booking-status.enum';
import { User } from '../../users/entities/user.entity';
import { BaseEntity } from '../../common/entities/base.entity';
import { numericTransformer } from '../../common/transformers/numeric.transformer';

@Entity('bookings')
@Index('idx_booking_user', ['userId', 'createdAt'])
@Index('idx_booking_sweeper', ['status', 'holdExpiresAt'])
export class Booking extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'user_id' })
  userId: number;

  @Column({ length: 10, unique: true })
  pnr: string;

  @Column({ default: false, name: 'is_break_journey' })
  isBreakJourney: boolean;

  @Column({ name: 'hold_expires_at', nullable: true, type: 'timestamptz' })
  holdExpiresAt: Date | null;

  @Column({ type: 'enum', enum: BookingStatus, default: BookingStatus.PENDING })
  status: BookingStatus;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    name: 'total_amount',
    transformer: numericTransformer,
  })
  totalAmount: number;
}
