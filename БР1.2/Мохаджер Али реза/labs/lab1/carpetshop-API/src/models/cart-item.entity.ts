import {
    BaseEntity,
    Column,
    CreateDateColumn,
    Entity,
    Index,
    ManyToOne,
    PrimaryGeneratedColumn,
    Unique,
} from 'typeorm';
import { Cart } from './cart.entity';
import { Carpet } from './carpet.entity';

@Entity()
@Unique(['cart', 'carpet'])
export class CartItem extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Index()
    @ManyToOne(() => Cart, (cart) => cart.items, {
        nullable: false,
        onDelete: 'CASCADE',
    })
    cart: Cart;

    @Index()
    @ManyToOne(() => Carpet, { nullable: false, onDelete: 'RESTRICT' })
    carpet: Carpet;

    @Column({ type: 'int', nullable: false, default: 1 })
    quantity: number;

    @CreateDateColumn({ type: 'timestamptz' })
    created_at: Date;
}

