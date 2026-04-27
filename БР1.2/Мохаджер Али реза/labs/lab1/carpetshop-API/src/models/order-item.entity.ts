import {
    BaseEntity,
    Column,
    Entity,
    Index,
    ManyToOne,
    PrimaryGeneratedColumn,
} from 'typeorm';
import { Order } from './order.entity';
import { Carpet } from './carpet.entity';

@Entity()
export class OrderItem extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Index()
    @ManyToOne(() => Order, (order) => order.items, {
        nullable: false,
        onDelete: 'CASCADE',
    })
    order: Order;

    @ManyToOne(() => Carpet, { nullable: false, onDelete: 'RESTRICT' })
    carpet: Carpet;

    @Column({ type: 'numeric', nullable: false })
    price: string;

    @Column({ type: 'int', nullable: false })
    quantity: number;
}

