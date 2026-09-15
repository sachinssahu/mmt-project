import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { Trip } from './trip.entity';
import { Stop } from '../../stops/entities/stop.entity';

@Entity('trip_stops')
@Index('uq_trip_stop_seq', ['tripId', 'seq'], { unique: true })
@Index('idx_trip_stop_search', ['stopId', 'departureAt'])
@Index('idx_trip_stop_trip', ['tripId'])
export class TripStop extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Trip)
  @JoinColumn({ name: 'trip_id' })
  trip: Trip;

  @Column({ name: 'trip_id' })
  tripId: number;

  @ManyToOne(() => Stop)
  @JoinColumn({ name: 'stop_id' })
  stop: Stop;

  @Column({ name: 'stop_id' })
  stopId: number;

  @Column({ type: 'smallint' })
  seq: number;

  @Column({ name: 'arrival_at', type: 'timestamptz', nullable: true })
  arrivalAt: Date | null;

  @Column({ name: 'departure_at', type: 'timestamptz', nullable: true })
  departureAt: Date | null;

  @Column({ name: 'is_skipped', default: false })
  isSkipped: boolean;
}
