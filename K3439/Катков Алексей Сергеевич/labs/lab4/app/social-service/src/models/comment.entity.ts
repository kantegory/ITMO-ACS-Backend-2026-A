import { Entity, Column, PrimaryGeneratedColumn, BaseEntity, CreateDateColumn } from 'typeorm';
@Entity()
export class Comment extends BaseEntity { @PrimaryGeneratedColumn() id:number; @Column({type:'text'}) text:string; @CreateDateColumn() createdAt:Date; @Column({type:'int'}) userId:number; @Column({type:'int'}) recipeId:number; }
