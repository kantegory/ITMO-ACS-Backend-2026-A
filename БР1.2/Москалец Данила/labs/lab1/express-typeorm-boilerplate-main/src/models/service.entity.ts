import {
    BaseEntity,
    Column,
    CreateDateColumn,
    Entity,
    JoinTable,
    ManyToMany,
    ManyToOne,
    OneToMany,
    OneToOne,
    PrimaryGeneratedColumn,
} from 'typeorm';

import { Company } from './company.entity';
import { Category } from './category.entity';
import { Discount } from './discount.entity';
import { ServiceRequest } from './service-request.entity';
import { Review } from './review.entity';
import { Favorite } from './favorite.entity';

@Entity()
export class Service extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: 'varchar', length: 255 })
    name: string;

    @Column({ type: 'text', nullable: true })
    description?: string | null;

    @Column({ type: 'decimal', precision: 10, scale: 2 })
    price: string;

    @Column({ type: 'boolean', default: false })
    isPublished: boolean;

    @CreateDateColumn()
    createdAt: Date;

    @ManyToOne(() => Company, (company) => company.services, {
        nullable: false,
        onDelete: 'CASCADE',
    })
    company: Company;

    @ManyToMany(() => Category, (category) => category.services, {
        eager: true,
    })
    @JoinTable()
    categories: Category[];

    @OneToOne(() => Discount, (discount) => discount.service)
    discount?: Discount | null;

    @OneToMany(() => ServiceRequest, (request) => request.service)
    requests: ServiceRequest[];

    @OneToMany(() => Review, (review) => review.service)
    reviews: Review[];

    @OneToMany(() => Favorite, (favorite) => favorite.service)
    favorites: Favorite[];
}
