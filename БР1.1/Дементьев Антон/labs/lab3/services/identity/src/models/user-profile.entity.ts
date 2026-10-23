import {
    Entity,
    Column,
    PrimaryColumn,
    OneToOne,
    JoinColumn,
    CreateDateColumn,
    UpdateDateColumn,
    BaseEntity,
} from 'typeorm';

import { User } from './user.entity';

@Entity('user_profiles')
export class UserProfile extends BaseEntity {
    @PrimaryColumn({ name: 'user_id', type: 'uuid' })
    userId: string;

    @OneToOne(() => User, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'user_id' })
    user: User;

    @Column({ type: 'varchar', length: 100, nullable: false })
    lastName: string;

    @Column({ type: 'varchar', length: 100, nullable: false })
    firstName: string;

    @Column({ type: 'varchar', length: 100, nullable: true })
    middleName: string;

    @Column({ type: 'varchar', length: 32, nullable: true })
    phone: string;

    @Column({ type: 'varchar', length: 100, nullable: true })
    city: string;

    @Column({ type: 'text', nullable: true })
    about: string;

    @Column({ type: 'date', nullable: true })
    birthDate: string;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
