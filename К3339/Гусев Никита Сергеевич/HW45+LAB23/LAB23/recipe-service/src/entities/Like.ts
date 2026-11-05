import { Entity, PrimaryGeneratedColumn, Column, Index, ManyToOne, JoinColumn } from "typeorm"
import { Recipe } from "./Recipe"

@Entity()
@Index(["recipe_id", "user_id"], { unique: true })
export class Like {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    recipe_id: number

    @Column()
    user_id: number

    @ManyToOne(() => Recipe, { onDelete: "CASCADE", nullable: false })
    @JoinColumn({ name: "recipe_id" })
    recipe: Recipe
}
