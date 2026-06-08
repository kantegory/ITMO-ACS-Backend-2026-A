import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToMany, JoinTable } from "typeorm";

@Entity("users")
export class User {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column()
    username!: string;

    @Column({ unique: true })
    email!: string;

    @Column()
    password_hash!: string;

    @Column({ type: "text", nullable: true })
    bio?: string;

    @Column({ nullable: true })
    avatar_url?: string;

    @CreateDateColumn()
    created_at!: Date;

    @ManyToMany(() => User, (user) => user.following)
    @JoinTable({
        name: "follows",
        joinColumn: { name: "follower_id", referencedColumnName: "id" },
        inverseJoinColumn: { name: "following_id", referencedColumnName: "id" }
    })
    following!: User[];

    @ManyToMany(() => User, (user) => user.followers)
    followers!: User[];
}