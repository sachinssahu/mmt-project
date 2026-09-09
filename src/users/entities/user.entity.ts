import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import { UserRole } from '../enums/user-role.enum';
import { BaseEntity } from '../../common/entities/base.entity';

@Entity('users')
export class User extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 255 })
  name: string;

  @Column({ length: 255, unique: true })
  email: string;

  @Column({ length: 15, unique: true })
  phone: string;

  @Column({ length: 255, name: 'password_hash' })
  passwordHash: string;

  @Column({ type: 'enum', default: UserRole.USER, enum: UserRole })
  role: UserRole;

  // timestamps gone - inherited
}
