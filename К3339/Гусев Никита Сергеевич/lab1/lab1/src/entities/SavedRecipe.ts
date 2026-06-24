import {
    Entity,
    PrimaryGeneratedColumn,
    Column
} from "typeorm"

@Entity()
export class SavedRecipe {

    @PrimaryGeneratedColumn()
    id: number

    @Column()
    recipe_id: number

    @Column()
    user_id: number
}