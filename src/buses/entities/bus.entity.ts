import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { BusType } from '../enums/bus-type.enum';
import { Operator } from '../../operators/entities/operator.entity';
import { BaseEntity } from '../../common/entities/base.entity';

@Entity('buses')
export class Bus extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Operator)
  @JoinColumn({ name: 'operator_id' })
  operator: Operator;

  @Column({ name: 'operator_id' })
  operatorId: number;

  @Column({ length: 20, name: 'registration_number', unique: true })
  registrationNumber: string;

  @Column({ type: 'enum', enum: BusType, name: 'bus_type' })
  busType: BusType;

  @Column({ default: true, name: 'is_active' })
  isActive: boolean;

  // timestamps gone - inherited
}
