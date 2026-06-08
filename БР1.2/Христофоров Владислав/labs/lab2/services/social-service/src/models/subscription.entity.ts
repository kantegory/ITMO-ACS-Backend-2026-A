import {
    Entity,
    PrimaryGeneratedColumn,
    CreateDateColumn,
    Column,
} from "typeorm";

@Entity("subscriptions")
export class Subscription {
    @PrimaryGeneratedColumn("uuid")
    id: string;

    @Column({ type: "uuid" })
    follower_id: string;

    @Column({ type: "uuid" })
    following_id: string;

    @CreateDateColumn()
    created_at: Date;
}
