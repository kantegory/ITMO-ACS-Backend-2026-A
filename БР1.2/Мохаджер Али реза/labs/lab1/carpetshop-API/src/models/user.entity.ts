import {
    BaseEntity,
    Column,
    CreateDateColumn,
    Entity,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from 'typeorm';
import { Exclude } from 'class-transformer';

@Entity()
export class User extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: 'varchar', length: 50, nullable: false })
    first_name: string;

    @Column({ type: 'varchar', length: 50, nullable: false })
    last_name: string;

    @Column({ type: 'varchar', length: 320, unique: true, nullable: false })
    email: string;

    @Exclude()
    @Column({ type: 'varchar', length: 150, nullable: false })
    password: string;

    @Column({ type: 'varchar', length: 30, nullable: true })
    phone: string | null;

    @Column({
        type: 'enum',
        enum: ['ADMIN', 'SELLER', 'CUSTOMER'],
        default: 'CUSTOMER',
    })
    role: 'ADMIN' | 'SELLER' | 'CUSTOMER';

    @Column({ type: 'boolean', default: false })
    is_verified: boolean;

    @CreateDateColumn({ type: 'timestamptz' })
    created_at: Date;

    @UpdateDateColumn({ type: 'timestamptz' })
    updated_at: Date;

    toJSON() {
        // Make sure sensitive fields never get serialized,
        // even if class-transformer isn't applied somewhere.
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { password, ...rest } = this as any;
        return rest;
    }
}
