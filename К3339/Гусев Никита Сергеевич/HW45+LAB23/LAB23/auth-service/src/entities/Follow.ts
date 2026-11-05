import { Entity, PrimaryGeneratedColumn, Column, Index, ManyToOne, JoinColumn } from "typeorm"
import { User } from "./User"

@Entity()
@Index(["follower_id", "following_id"], { unique: true })
export class Follow {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    follower_id: number

    @Column()
    following_id: number

    @ManyToOne(() => User, { onDelete: "CASCADE", nullable: false })
    @JoinColumn({ name: "follower_id" })
    follower: User

    @ManyToOne(() => User, { onDelete: "CASCADE", nullable: false })
    @JoinColumn({ name: "following_id" })
    following: User
}
