import {
    BeforeInsert,
    BeforeUpdate,
    Column,
    Entity,
    OneToMany,
} from 'typeorm';
import { AppBaseEntity } from './base.entity';
import { UserRole } from '../common/enums';
import { Review } from './review.entity';
import { Reservation } from './reservation.entity';
import hashPassword from '../utils/hash-password';

@Entity({ name: 'users' })
export class User extends AppBaseEntity {
    @Column({
        type: 'enum',
        enum: UserRole,
        default: UserRole.USER,
    })
    role: UserRole;

    @Column({ type: 'varchar', length: 100 })
    firstName: string;

    @Column({ type: 'varchar', length: 100 })
    lastName: string;

    @Column({ type: 'varchar', length: 255, unique: true })
    email: string;

    @Column({ type: 'varchar', length: 30, unique: true })
    phone: string;

    @Column({ type: 'varchar', length: 255 })
    password: string;

    @Column({ type: 'boolean', default: false })
    isVerified: boolean;

    @OneToMany(() => Review, (review) => review.user)
    reviews: Review[];

    @OneToMany(() => Reservation, (reservation) => reservation.user)
    reservations: Reservation[];

    @BeforeInsert()
    @BeforeUpdate()
    hashPasswordIfNeeded() {
        if (this.password && !this.password.startsWith('$2')) {
            this.password = hashPassword(this.password);
        }
    }
}
