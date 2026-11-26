import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

@Entity()
export class Step {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    recipe_id: number;

    @Column()
    step_number: number;

    @Column("text")
    instruction: string;
}
