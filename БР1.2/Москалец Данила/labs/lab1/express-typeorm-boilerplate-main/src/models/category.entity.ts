import {
    BaseEntity,
    Column,
    Entity,
    ManyToMany,
    PrimaryGeneratedColumn,
} from 'typeorm';

import { Service } from './service.entity';

@Entity()
export class Category extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: 'varchar', length: 255, unique: true })
    title: string;

    @Column({ type: 'boolean', default: true })
    isPublished: boolean;

    @ManyToMany(() => Service, (service) => service.categories)
    services: Service[];
}
