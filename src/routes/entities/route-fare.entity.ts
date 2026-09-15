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
import { numericTransformer } from '../../common/transformers/numeric.transformer';

@Entity('route_fares')
@Check('chk_route_fare_seq_order', 'to_seq > from_seq')
@Index('uq_route_fare_segment', ['routeId', 'fromSeq', 'toSeq'], {
  unique: true,
})
export class RouteFare extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Route)
  @JoinColumn({ name: 'route_id' })
  route: Route;

  @Column({ name: 'route_id' })
  routeId: number;

  @Column({ name: 'from_seq', type: 'smallint' })
  fromSeq: number;

  @Column({ name: 'to_seq', type: 'smallint' })
  toSeq: number;

  @Column({
    name: 'base_fare',
    type: 'decimal',
    precision: 10,
    scale: 2,
    transformer: numericTransformer,
  })
  baseFare: number;
}
