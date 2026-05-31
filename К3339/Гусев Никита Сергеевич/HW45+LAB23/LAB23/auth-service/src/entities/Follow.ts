import {
    Entity,
    PrimaryGeneratedColumn,
    Column
} from "typeorm"

@Entity()
export class Follow {

    @PrimaryGeneratedColumn()
    id: number

    @Column()
    follower_id: number

    @Column()
    following_id: number
}