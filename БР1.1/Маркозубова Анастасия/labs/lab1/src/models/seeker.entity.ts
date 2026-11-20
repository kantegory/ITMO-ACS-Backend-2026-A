import {
    Entity,
    Column,
    PrimaryGeneratedColumn,
    BaseEntity,
    CreateDateColumn,
    UpdateDateColumn,
    OneToOne,
    OneToMany,
    JoinColumn,
} from 'typeorm';

import { User } from './user.entity';
import { Resume } from './resume.entity';

@Entity('seekers')
export class Seeker extends BaseEntity {

    @PrimaryGeneratedColumn()
    seeker_id: number;

    @OneToOne(() => User, (user) => user.seeker, {
        nullable: false,
        onDelete: 'CASCADE',
    })
    @JoinColumn({ name: 'user_id' })
    user: User;

    @Column({ type: 'varchar', length: 100, nullable: false })
    first_name: string;

    @Column({ type: 'varchar', length: 100, nullable: false })
    last_name: string;

    @Column({ type: 'varchar', length: 20, nullable: true })
    phone: string;

    @Column({ type: 'text', nullable: true })
    bio: string;

    @Column({ type: 'text', nullable: true })
    contact_info: string;

    @CreateDateColumn({ type: 'timestamp' })
    created_at: Date;

    @UpdateDateColumn({ type: 'timestamp' })
    updated_at: Date;

    @OneToMany(() => Resume, (resume) => resume.seeker)
    resumes: Resume[];

}
