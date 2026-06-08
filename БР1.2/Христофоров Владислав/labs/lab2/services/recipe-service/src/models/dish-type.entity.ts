import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from "typeorm";
import { RecipeDishType } from "./recipe-dish-type.entity";

@Entity("dish_types")
export class DishType {
    @PrimaryGeneratedColumn("uuid")
    id: string;

    @Column({ unique: true })
    name: string;

    @OneToMany(
        () => RecipeDishType,
        (recipeDishType: RecipeDishType) => recipeDishType.dish_type,
    )
    recipe_dish_types: RecipeDishType[];
}
