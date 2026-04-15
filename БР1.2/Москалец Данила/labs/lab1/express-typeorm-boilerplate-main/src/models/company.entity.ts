import {
    BaseEntity,
    Column,
    CreateDateColumn,
    Entity,
    ManyToOne,
    OneToMany,
    PrimaryGeneratedColumn,
} from 'typeorm';

import { User } from './user.entity';
import { Service } from './service.entity';

@Entity()
export class Company extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: 'varchar', length: 255 })
    title: string;

    @Column({ type: 'text', nullable: true })
    description?: string | null;

    @Column({ type: 'varchar', length: 500, nullable: true })
    logo?: string | null;

    @Column({ type: 'varchar', length: 500, nullable: true })
    website?: string | null;

    @CreateDateColumn()
    createdAt: Date;

    @ManyToOne(() => User, (user) => user.companies, {
        nullable: false,
        onDelete: 'CASCADE',
    })
    owner: User;

    @OneToMany(() => Service, (service) => service.company)
    services: Service[];
}
