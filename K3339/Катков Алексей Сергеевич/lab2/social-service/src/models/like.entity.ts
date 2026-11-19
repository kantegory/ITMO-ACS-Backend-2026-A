import { Entity, PrimaryGeneratedColumn, BaseEntity, CreateDateColumn, Column, Unique } from 'typeorm';
@Entity() @Unique(['userId','recipeId'])
export class Like extends BaseEntity { @PrimaryGeneratedColumn() id:number; @CreateDateColumn() createdAt:Date; @Column({type:'int'}) userId:number; @Column({type:'int'}) recipeId:number; }
