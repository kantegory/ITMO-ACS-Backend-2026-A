import {
    Entity,
    Column,
    PrimaryGeneratedColumn,
    ManyToOne,
    JoinColumn,
} from 'typeorm';
import { Restaurant } from './restaurant.entity';

@Entity('tables')
export class Table {
    @PrimaryGeneratedColumn()
    table_id!: number;

    @Column()
    restaurant_id!: number;

    @Column({ type: 'integer' })
    capacity!: number;

    @ManyToOne(() => Restaurant)
    @JoinColumn({ name: 'restaurant_id' })
    restaurant!: Restaurant;
}
