import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    DeleteDateColumn,
} from "typeorm";
import { Exclude } from "class-transformer";

@Entity("users")
export class User {
    @PrimaryGeneratedColumn("uuid")
    id: string;

    @Column({ unique: true })
    username: string;

    @Column({ unique: true })
    email: string;

    @Exclude()
    @Column()
    password_hash: string;

    @Column({ type: "text", nullable: true })
    bio: string;

    @Column({ nullable: true })
    avatar_url: string;

    @Column({
        type: "enum",
        enum: ["user", "moderator", "admin"],
        default: "user",
    })
    role: string;

    @Column({ default: false })
    is_banned: boolean;

    @CreateDateColumn()
    created_at: Date;

    @UpdateDateColumn()
    updated_at: Date;

    @DeleteDateColumn()
    deleted_at: Date;
}
