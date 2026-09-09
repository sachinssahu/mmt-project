import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Bus } from './bus.entity';
import { SeatType } from '../enums/seat-type.enum';
import { DeckType } from '../enums/deck-type.enum';
import { BaseEntity } from '../../common/entities/base.entity';

@Entity('seats')
@Index('uq_bus_seat', ['busId', 'seatNumber'], { unique: true })
export class Seat extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Bus)
  @JoinColumn({ name: 'bus_id' })
  bus: Bus;

  @Column({ name: 'bus_id' })
  busId: number;

  @Column({ length: 5, name: 'seat_number' })
  seatNumber: string;

  @Column({ type: 'enum', enum: SeatType, name: 'seat_type' })
  seatType: SeatType;

  @Column({ type: 'enum', enum: DeckType })
  deck: DeckType;

  // timestamps gone - inherited
}
