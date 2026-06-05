import {
    Entity,
    Column,
    PrimaryGeneratedColumn,
    BaseEntity,
    ManyToOne,
    JoinColumn,
    CreateDateColumn,
    Index,
} from 'typeorm';
import { User } from './user.entity';

export enum UserRole { LANDLORD = 'landlord', RENTER = 'renter' }

@Entity('user_roles')
@Index(['userId', 'role'], { unique: true })
export class UserRoleEntity extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ nullable: false })
    userId: number;

    @Column({ type: 'enum', enum: UserRole, nullable: false })
    role: UserRole;

    @CreateDateColumn()
    assignedAt: Date;

    @ManyToOne(() => User, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'userId' })
    user: User;
}
