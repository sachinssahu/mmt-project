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
import { numericTransformer } from '../../common/transformers/numeric.transformer';

@Entity('trips')
@Index('uq_bus_not_double_booked', ['busId', 'baseDepartureAt'], {
  unique: true,
})
@Index('idx_trip_route_date', ['routeId', 'serviceDate'])
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

  @Column({ name: 'service_date', type: 'date' })
  serviceDate: string;

  @Column({ name: 'base_departure_at', type: 'timestamptz' })
  baseDepartureAt: Date;

  @Column({
    name: 'fare_multiplier',
    default: 1,
    type: 'decimal',
    precision: 4,
    scale: 2,
    transformer: numericTransformer,
  })
  fareMultiplier: number;

  @Column({ type: 'enum', enum: TripStatus, default: TripStatus.SCHEDULED })
  status: TripStatus;

  // timestamps gone - inherited
}
