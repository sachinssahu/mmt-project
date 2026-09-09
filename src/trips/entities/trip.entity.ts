import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Bus } from '../../buses/entities/bus.entity';
import { Route } from '../../routes/entities/route.entity';
import { TripStatus } from '../enums/trip-status.enum';
import { BaseEntity } from '../../common/entities/base.entity';

@Entity('trips')
@Index('idx_trip_route_departure', ['routeId', 'departureTime'])
export class Trip extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Bus)
  @JoinColumn({ name: 'bus_id' })
  bus: Bus;

  @Column({ name: 'bus_id' })
  busId: number;

  @ManyToOne(() => Route)
  @JoinColumn({ name: 'route_id' })
  route: Route;

  @Column({ name: 'route_id' })
  routeId: number;

  @Column({ name: 'departure_time', type: 'timestamptz' })
  departureTime: Date;

  @Column({ name: 'arrival_time', type: 'timestamptz' })
  arrivalTime: Date;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  fare: number;

  @Column({ type: 'enum', enum: TripStatus, default: TripStatus.SCHEDULED })
  status: TripStatus;

  // timestamps gone - inherited
}
