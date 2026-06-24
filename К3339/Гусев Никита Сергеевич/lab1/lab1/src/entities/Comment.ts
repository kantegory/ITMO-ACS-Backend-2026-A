import {
    Entity,
    PrimaryGeneratedColumn,
    Column
} from "typeorm"

@Entity()
export class Comment {

    @PrimaryGeneratedColumn()
    id: number

    @Column()
    text: string

    @Column()
    recipe_id: number

    @Column()
    user_id: number
}