import { Entity, Column, PrimaryGeneratedColumn, BaseEntity, CreateDateColumn, UpdateDateColumn, OneToMany, ManyToMany, JoinTable } from 'typeorm';
import { Ingredient } from './ingredient.entity';
import { DishType } from './dish-type.entity';
import { RecipeStep } from './recipe-step.entity';
export enum Difficulty { EASY='easy', MEDIUM='medium', HARD='hard' }
@Entity()
export class Recipe extends BaseEntity {
 @PrimaryGeneratedColumn() id:number;
 @Column({type:'varchar', length:300}) title:string;
 @Column({type:'text', nullable:true}) description:string;
 @Column({type:'enum', enum:Difficulty, default:Difficulty.EASY}) difficulty:Difficulty;
 @Column({type:'int', nullable:true}) cookingTime:number;
 @Column({type:'int', nullable:true}) servings:number;
 @Column({type:'varchar', length:500, nullable:true}) photoUrl:string;
 @Column({type:'varchar', length:500, nullable:true}) videoUrl:string;
 @Column({type:'int'}) authorId:number;
 @CreateDateColumn() createdAt:Date;
 @UpdateDateColumn() updatedAt:Date;
 @ManyToMany(() => Ingredient, (ingredient) => ingredient.recipes) @JoinTable() ingredients:Ingredient[];
 @ManyToMany(() => DishType, (dishType) => dishType.recipes) @JoinTable() dishTypes:DishType[];
 @OneToMany(() => RecipeStep, (step) => step.recipe) steps:RecipeStep[];
}
