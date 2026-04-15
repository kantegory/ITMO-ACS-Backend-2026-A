import { Entity, PrimaryGeneratedColumn, CreateDateColumn, ManyToOne, Unique, Column } from "typeorm";
import { User } from "./User";

@Entity()
@Unique(["subscriber_id", "author_id"])
export class Subscription {
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => User, user => user.subscriptions)
    subscriber: User;

    @Column()
    subscriber_id: number;

    @ManyToOne(() => User)
    author: User;

    @Column()
    author_id: number;

    @CreateDateColumn()
    created_at: Date;
}