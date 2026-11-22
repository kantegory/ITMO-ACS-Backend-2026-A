import {
    Entity,
    Column,
    PrimaryGeneratedColumn,
    BaseEntity,
    CreateDateColumn,
    UpdateDateColumn,
} from 'typeorm';

import { Role } from './enums';

@Entity()
export class User extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: 'varchar', length: 50, unique: true })
    username: string;

    @Column({ type: 'varchar', length: 255, unique: true })
    email: string;

    // в коде поле называется password (так его хеширует user.subscriber.ts),
    // а в базе колонка называется password_hash, как на ER-диаграмме
    @Column({ name: 'password_hash', type: 'varchar', length: 255 })
    password: string;

    @Column({ type: 'enum', enum: Role, default: Role.USER })
    role: Role;

    @CreateDateColumn()
    created_at: Date;

    @UpdateDateColumn()
    updated_at: Date;
}
