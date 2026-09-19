import {
    Entity,
    Column,
    PrimaryGeneratedColumn,
    BaseEntity,
    ManyToOne,
    JoinColumn,
    CreateDateColumn,
    OneToMany,
} from 'typeorm';
import { Role } from './role.entity';
import { Review } from './review.entity';
import { Reservation } from './reservation.entity';

@Entity('users')
export class User extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ name: 'role_id', type: 'int', nullable: true })
    roleId: number;

    @ManyToOne(() => Role, (role) => role.users, { nullable: true })
    @JoinColumn({ name: 'role_id' })
    role: Role;

    @Column({ name: 'first_name', type: 'varchar', length: 100 })
    firstName: string;

    @Column({ name: 'last_name', type: 'varchar', length: 100 })
    lastName: string;

    @Column({ name: 'middle_name', type: 'varchar', length: 100, nullable: true })
    middleName: string;

    @Column({ type: 'varchar', length: 255, unique: true })
    email: string;

    @Column({ type: 'varchar', length: 255, select: false })
    password: string;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @OneToMany(() => Review, (review) => review.user)
    reviews: Review[];

    @OneToMany(() => Reservation, (reservation) => reservation.user)
    reservations: Reservation[];
}
