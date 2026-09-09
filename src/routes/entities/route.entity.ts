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

@Entity('routes')
@Index('uq_route_cities', ['fromCityId', 'toCityId'], { unique: true })
export class Route extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

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

  @Column({ name: 'distance_km' })
  distanceKm: number;

  @Column({ name: 'duration_minutes' })
  durationMinutes: number;

  // timestamps gone - inherited
}
