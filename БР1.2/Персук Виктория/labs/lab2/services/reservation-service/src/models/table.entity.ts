import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

// restaurant_id references restaurant_db — no ORM relation
@Entity('tables')
export class Table {
    @PrimaryGeneratedColumn()
    table_id!: number;

    @Column({ type: 'int' })
    restaurant_id!: number;

    @Column({ type: 'integer' })
    capacity!: number;
}
