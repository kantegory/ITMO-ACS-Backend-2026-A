import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from "typeorm";

@Entity("favorites")
export class Favorite {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column()
    userId!: number;

    @Column()
    recipeId!: number; 

    @CreateDateColumn()
    created_at!: Date;
}