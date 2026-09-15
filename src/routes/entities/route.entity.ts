import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { City } from '../../cities/entities/city.entity';
import { BaseEntity } from '../../common/entities/base.entity';
import { Operator } from '../../operators/entities/operator.entity';
import { RouteDirection } from '../enums/route-direction.enum';

@Entity('routes')
@Index('idx_route_city_pair', ['fromCityId', 'toCityId'])
@Index('idx_route_operator', ['operatorId'])
@Index('idx_route_service_group', ['serviceGroup'])
export class Route extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Operator)
  @JoinColumn({ name: 'operator_id' })
  operator: Operator;

  @Column({ name: 'operator_id' })
  operatorId: number;

  @Column({ length: 150 })
  name: string;

  @ManyToOne(() => City)
  @JoinColumn({ name: 'from_city_id' })
  fromCity: City;

  @Column({ name: 'from_city_id' })
  fromCityId: number;

  @ManyToOne(() => City)
  @JoinColumn({ name: 'to_city_id' })
  toCity: City;

  @Column({ name: 'to_city_id' })
  toCityId: number;

  @Column({ length: 50, name: 'service_group' })
  serviceGroup: string;

  @Column({
    type: 'enum',
    enum: RouteDirection,
  })
  direction: RouteDirection;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;
  // timestamps gone - inherited
}
