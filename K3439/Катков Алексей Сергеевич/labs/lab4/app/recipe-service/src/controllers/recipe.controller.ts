import { Body, Delete, Get, Param, Patch, Post, QueryParam } from 'routing-controllers';
import { OpenAPI } from 'routing-controllers-openapi';
import { IsArray, IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';
import { In } from 'typeorm';
import EntityController from '../common/entity-controller';
import BaseController from '../common/base-controller';
import { Recipe, Difficulty } from '../models/recipe.entity';
import { Ingredient } from '../models/ingredient.entity';
import { DishType } from '../models/dish-type.entity';
import { publishRecipeCreated } from '../rabbitmq/recipe-events.publisher';
class RecipeCreateDto { @IsString() title:string; @IsOptional() @IsString() description?:string; @IsEnum(Difficulty) difficulty:Difficulty; @IsOptional() @IsNumber() @Type(()=>Number) cookingTime?:number; @IsOptional() @IsNumber() @Type(()=>Number) servings?:number; @IsOptional() @IsString() photoUrl?:string; @IsOptional() @IsString() videoUrl?:string; @IsNumber() @Type(()=>Number) authorId:number; @IsOptional() @IsArray() @IsNumber({}, {each:true}) @Type(()=>Number) ingredientIds?:number[]; @IsOptional() @IsArray() @IsNumber({}, {each:true}) @Type(()=>Number) dishTypeIds?:number[]; }
class RecipeUpdateDto { @IsOptional() @IsString() title?:string; @IsOptional() @IsString() description?:string; @IsOptional() @IsEnum(Difficulty) difficulty?:Difficulty; @IsOptional() @IsNumber() @Type(()=>Number) cookingTime?:number; @IsOptional() @IsNumber() @Type(()=>Number) servings?:number; @IsOptional() @IsString() photoUrl?:string; @IsOptional() @IsString() videoUrl?:string; @IsOptional() @IsArray() @IsNumber({}, {each:true}) @Type(()=>Number) ingredientIds?:number[]; @IsOptional() @IsArray() @IsNumber({}, {each:true}) @Type(()=>Number) dishTypeIds?:number[]; }
@EntityController({baseRoute:'/recipes', entity:Recipe})
class RecipeController extends BaseController {
 @Get('/') async getRecipes(@QueryParam('query',{required:false,type:String}) query?:string,@QueryParam('difficulty',{required:false,type:String}) difficulty?:Difficulty){ const qb=this.repository.createQueryBuilder('recipe').leftJoinAndSelect('recipe.ingredients','ingredients').leftJoinAndSelect('recipe.dishTypes','dishTypes'); if(query) qb.andWhere('LOWER(recipe.title) LIKE LOWER(:query)',{query:`%${query}%`}); if(difficulty) qb.andWhere('recipe.difficulty = :difficulty',{difficulty}); return qb.getMany(); }
 @Get('/details') async getRecipeById(@QueryParam('id',{required:true,type:Number}) id:number){ const recipe=await this.repository.findOne({where:{id}, relations:{ingredients:true,dishTypes:true,steps:true}}); return recipe || {message:'Recipe is not found'}; }
 @Get('/internal/:id') @OpenAPI({summary:'Internal get recipe by id'}) async internalRecipe(@Param('id') id:number){ const r:any=await this.repository.findOneBy({id}); if(!r) return {message:'Recipe is not found'}; return {id:r.id,title:r.title,authorId:r.authorId}; }
 @Post('/') async createRecipe(@Body({type:RecipeCreateDto}) data:RecipeCreateDto){ const ingredients=data.ingredientIds?.length?await Ingredient.findBy({id:In(data.ingredientIds)}):[]; const dishTypes=data.dishTypeIds?.length?await DishType.findBy({id:In(data.dishTypeIds)}):[]; const recipe=this.repository.create({...data, ingredients, dishTypes}); const savedRecipe:any=await this.repository.save(recipe); await publishRecipeCreated({event:'recipe.created',recipeId:savedRecipe.id,title:savedRecipe.title,authorId:savedRecipe.authorId,createdAt:new Date().toISOString()}); return savedRecipe; }
 @Patch('/update') async updateRecipe(@QueryParam('id',{required:true,type:Number}) id:number,@Body({type:RecipeUpdateDto}) data:RecipeUpdateDto){ const recipe:any=await this.repository.findOne({where:{id},relations:{ingredients:true,dishTypes:true}}); if(!recipe) return {message:'Recipe is not found'}; const {ingredientIds,dishTypeIds,...recipeData}=data; this.repository.merge(recipe,recipeData); if(ingredientIds) recipe.ingredients=ingredientIds.length?await Ingredient.findBy({id:In(ingredientIds)}):[]; if(dishTypeIds) recipe.dishTypes=dishTypeIds.length?await DishType.findBy({id:In(dishTypeIds)}):[]; return this.repository.save(recipe); }
 @Delete('/delete') async deleteRecipe(@QueryParam('id',{required:true,type:Number}) id:number){ const recipe=await this.repository.findOneBy({id}); if(!recipe) return {message:'Recipe is not found'}; await this.repository.remove(recipe); return {message:'Recipe deleted'}; }
}
export default RecipeController;
