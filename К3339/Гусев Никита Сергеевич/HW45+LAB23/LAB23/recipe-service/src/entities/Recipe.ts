import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
} from "typeorm"

@Entity()
export class Recipe {

    @PrimaryGeneratedColumn()
    id: number

    @Column()
    title: string

    @Column()
    description: string

    @Column()
    difficulty: string

    @Column()
    cooking_time: number

    @Column()
    authorId: number
}