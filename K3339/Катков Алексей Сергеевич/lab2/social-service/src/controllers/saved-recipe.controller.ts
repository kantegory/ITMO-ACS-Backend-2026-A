import { Delete, Get, Post, QueryParam, Req, UseBefore } from 'routing-controllers';
import EntityController from '../common/entity-controller';
import BaseController from '../common/base-controller';
import { SavedRecipe } from '../models/saved-recipe.entity';
import AuthMiddleware, { RequestWithUser } from '../middlewares/auth.middleware';
import { recipeExists } from '../utils/recipe-client';
@EntityController({baseRoute:'/saved-recipes', entity:SavedRecipe})
class SavedRecipeController extends BaseController {
 @Get('/') async getAll(@QueryParam('userId',{required:false,type:Number}) userId?:number){ return this.repository.find({where:userId?{userId}:{}}); }
 @Post('/') @UseBefore(AuthMiddleware) async create(@Req() req:RequestWithUser,@QueryParam('recipeId',{required:true,type:Number}) recipeId:number){ if(!(await recipeExists(recipeId))) return {message:'Recipe not found'}; const exists=await this.repository.findOneBy({userId:req.user.id,recipeId}); if(exists) return {message:'Recipe already saved'}; return this.repository.save(this.repository.create({userId:req.user.id,recipeId})); }
 @Delete('/by-user-recipe') @UseBefore(AuthMiddleware) async deleteByUserAndRecipe(@Req() req:RequestWithUser,@QueryParam('recipeId',{required:true,type:Number}) recipeId:number){ const item=await this.repository.findOneBy({userId:req.user.id,recipeId}); if(!item) return {message:'Saved recipe is not found'}; await this.repository.remove(item); return {message:'Saved recipe deleted'}; }
 @Delete('/delete') async deleteById(@QueryParam('id',{required:true,type:Number}) id:number){ const item=await this.repository.findOneBy({id}); if(!item) return {message:'Saved recipe is not found'}; await this.repository.remove(item); return {message:'Saved recipe deleted'}; }
}
export default SavedRecipeController;
