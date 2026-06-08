import {
    Entity,
    PrimaryGeneratedColumn,
    CreateDateColumn,
    ManyToOne,
    JoinColumn,
    Column,
} from "typeorm";
import { Recipe } from "./recipe.entity";

@Entity("saved_recipes")
export class SavedRecipe {
    @PrimaryGeneratedColumn("uuid")
    id: string;

    @Column({ type: "uuid" })
    user_id: string;

    @ManyToOne(() => Recipe, (recipe) => recipe.saved_recipes, {
        nullable: false,
    })
    @JoinColumn({ name: "recipe_id" })
    recipe: Recipe;

    @CreateDateColumn()
    created_at: Date;
}
