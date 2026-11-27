import { Delete, Get, Post, QueryParam, Req, UseBefore } from 'routing-controllers';
import EntityController from '../common/entity-controller';
import BaseController from '../common/base-controller';
import { Like } from '../models/like.entity';
import AuthMiddleware, { RequestWithUser } from '../middlewares/auth.middleware';
import { recipeExists } from '../utils/recipe-client';
@EntityController({baseRoute:'/likes', entity:Like})
class LikeController extends BaseController {
 @Get('/') async getAll(@QueryParam('recipeId',{required:false,type:Number}) recipeId?:number,@QueryParam('userId',{required:false,type:Number}) userId?:number){ const where:any={}; if(recipeId) where.recipeId=recipeId; if(userId) where.userId=userId; return this.repository.find({where}); }
 @Post('/') @UseBefore(AuthMiddleware) async create(@Req() req:RequestWithUser,@QueryParam('recipeId',{required:true,type:Number}) recipeId:number){ if(!(await recipeExists(recipeId))) return {message:'Recipe not found'}; const exists=await this.repository.findOneBy({userId:req.user.id,recipeId}); if(exists) return {message:'Like already exists'}; return this.repository.save(this.repository.create({userId:req.user.id,recipeId})); }
 @Delete('/by-user-recipe') @UseBefore(AuthMiddleware) async deleteByUserAndRecipe(@Req() req:RequestWithUser,@QueryParam('recipeId',{required:true,type:Number}) recipeId:number){ const like=await this.repository.findOneBy({userId:req.user.id,recipeId}); if(!like) return {message:'Like is not found'}; await this.repository.remove(like); return {message:'Like deleted'}; }
 @Delete('/delete') async deleteById(@QueryParam('id',{required:true,type:Number}) id:number){ const like=await this.repository.findOneBy({id}); if(!like) return {message:'Like is not found'}; await this.repository.remove(like); return {message:'Like deleted'}; }
}
export default LikeController;
