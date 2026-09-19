import {
    Entity,
    Column,
    PrimaryGeneratedColumn,
    BaseEntity,
    OneToMany,
} from 'typeorm';
import { User } from './user.entity';

export enum RoleName {
    ADMIN = 'admin',
    USER = 'user',
    OWNER = 'owner',
}

@Entity('roles')
export class Role extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: 'varchar', length: 50, unique: true })
    name: RoleName;

    @OneToMany(() => User, (user) => user.role)
    users: User[];
}
