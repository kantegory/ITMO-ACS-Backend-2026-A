import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from "typeorm";

@Entity()
export class Subscription {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    subscriber_id: number;  // кто подписывается

    @Column()
    author_id: number;       // на кого подписываются

    @CreateDateColumn()
    created_at: Date;
}
