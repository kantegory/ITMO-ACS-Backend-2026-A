import { Entity, PrimaryGeneratedColumn, Column } from "typeorm"

@Entity()
export class Recipe {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    title: string

    @Column({ default: "" })
    description: string

    @Column()
    difficulty: string

    @Column({ default: 1 })
    cooking_time: number

    @Column({ default: 1 })
    servings: number

    @Column()
    authorId: number
}
