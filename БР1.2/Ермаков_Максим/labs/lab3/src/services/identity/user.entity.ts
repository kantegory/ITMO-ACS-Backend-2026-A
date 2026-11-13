import { BeforeInsert, BeforeUpdate, Column, Entity } from 'typeorm';
import bcrypt from 'bcrypt';
import { AppBaseEntity } from '../../common/base.entity';
import { UserRole } from '../../common/enums';

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

    @BeforeInsert()
    @BeforeUpdate()
    hashPasswordIfNeeded() {
        if (this.password && !this.password.startsWith('$2')) {
            this.password = bcrypt.hashSync(this.password, bcrypt.genSaltSync(8));
        }
    }
}
