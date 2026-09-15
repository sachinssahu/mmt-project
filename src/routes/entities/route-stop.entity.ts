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
import { Route } from './route.entity';
import { Stop } from '../../stops/entities/stop.entity';

@Entity('route_stops')
@Check('chk_route_stop_halt', 'departure_offset_min >= arrival_offset_min')
@Index('uq_route_stop_seq', ['routeId', 'seq'], { unique: true })
@Index('uq_route_stop_stop', ['routeId', 'stopId'], { unique: true })
@Index('idx_route_stop_stop', ['stopId'])
export class RouteStop extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Route)
  @JoinColumn({ name: 'route_id' })
  route: Route;

  @Column({ name: 'route_id' })
  routeId: number;

  @ManyToOne(() => Stop)
  @JoinColumn({ name: 'stop_id' })
  stop: Stop;

  @Column({ name: 'stop_id' })
  stopId: number;

  @Column({ type: 'smallint' })
  seq: number;

  @Column({ type: 'int', name: 'arrival_offset_min' })
  arrivalOffsetMin: number;

  @Column({ type: 'int', name: 'departure_offset_min' })
  departureOffsetMin: number;

  @Column({ type: 'int', name: 'distance_from_origin_km' })
  distanceFromOriginKm: number;

  @Column({ name: 'boarding_allowed', default: true })
  boardingAllowed: boolean;

  @Column({ name: 'dropping_allowed', default: true })
  droppingAllowed: boolean;
}
