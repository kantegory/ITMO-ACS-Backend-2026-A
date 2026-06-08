import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from "typeorm";

@Entity("likes")
export class Like {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column()
    userId!: number; 

    @Column()
    recipeId!: number; 

    @CreateDateColumn()
    created_at!: Date;
}