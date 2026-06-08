import { Entity, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from "typeorm";
import { Recipe } from "./recipe.entity";
import { DishType } from "./dish-type.entity";

@Entity("recipe_dish_types")
export class RecipeDishType {
    @PrimaryGeneratedColumn("uuid")
    id: string;

    @ManyToOne(() => Recipe, (recipe: Recipe) => recipe.dish_types, {
        nullable: false,
    })
    @JoinColumn({ name: "recipe_id" })
    recipe: Recipe;

    @ManyToOne(
        () => DishType,
        (dishType: DishType) => dishType.recipe_dish_types,
        { nullable: false },
    )
    @JoinColumn({ name: "dish_type_id" })
    dish_type: DishType;
}
