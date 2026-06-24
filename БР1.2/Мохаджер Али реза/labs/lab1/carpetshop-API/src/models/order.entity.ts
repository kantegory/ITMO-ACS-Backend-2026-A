import {
    BaseEntity,
    Column,
    CreateDateColumn,
    Entity,
    Index,
    ManyToOne,
    OneToMany,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from 'typeorm';
import { User } from './user.entity';
import { OrderItem } from './order-item.entity';

export type OrderStatus =
    | 'PENDING'
    | 'PAID'
    | 'SHIPPED'
    | 'DELIVERED'
    | 'CANCELED';

@Entity()
export class Order extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Index()
    @ManyToOne(() => User, { nullable: false, onDelete: 'RESTRICT' })
    user: User;

    @Column({ type: 'numeric', nullable: false, default: 0 })
    total_price: string;

    @Column({
        type: 'enum',
        enum: ['PENDING', 'PAID', 'SHIPPED', 'DELIVERED', 'CANCELED'],
        default: 'PENDING',
    })
    status: OrderStatus;

    @Column({ type: 'text', nullable: false })
    address: string;

    @OneToMany(() => OrderItem, (item) => item.order)
    items: OrderItem[];

    @CreateDateColumn({ type: 'timestamptz' })
    created_at: Date;

    @UpdateDateColumn({ type: 'timestamptz' })
    updated_at: Date;
}

