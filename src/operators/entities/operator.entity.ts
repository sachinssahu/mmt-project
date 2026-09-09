import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';

@Entity('operators')
export class Operator extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 255 })
  name: string;

  @Column({ length: 255, name: 'contact_email' })
  contactEmail: string;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  // timestamps gone - inherited
}
