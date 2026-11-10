import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToMany,
} from 'typeorm';
import { Reservation } from './Reservation';
import { Review } from './Review';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn({ name: 'user_id' })
  user_id!: number;

  @Column({ type: 'varchar', length: 100 })
  name!: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  email!: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  phone!: string | null;

  @Column({ type: 'varchar', length: 255 })
  password_hash!: string;

  @CreateDateColumn({ name: 'created_at' })
  created_at!: Date;

  @OneToMany(() => Reservation, (r) => r.user)
  reservations!: Reservation[];

  @OneToMany(() => Review, (r) => r.user)
  reviews!: Review[];
}
