import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { City } from '../../cities/entities/city.entity';

@Entity('stops')
@Index('uq_stop_city_name', ['cityId', 'name'], { unique: true })
@Index('idx_stop_city', ['cityId'])
export class Stop extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => City)
  @JoinColumn({ name: 'city_id' })
  city: City;

  @Column({ name: 'city_id' })
  cityId: number;

  @Column({ length: 150 })
  name: string;

  @Column({ length: 255 })
  address: string;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;
}
