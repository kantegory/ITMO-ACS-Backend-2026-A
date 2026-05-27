import { Body, Delete, Get, Patch, Post, QueryParam, Req, UseBefore } from 'routing-controllers';
import { OpenAPI } from 'routing-controllers-openapi';
import { IsNumber, IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';
import EntityController from '../common/entity-controller';
import BaseController from '../common/base-controller';
import { Comment } from '../models/comment.entity';
import AuthMiddleware, { RequestWithUser } from '../middlewares/auth.middleware';
import { recipeExists } from '../utils/recipe-client';
class CreateCommentDto { @IsString() text:string; @IsNumber() @Type(()=>Number) recipeId:number; }
class UpdateCommentDto { @IsOptional() @IsString() text?:string; }
@EntityController({baseRoute:'/comments', entity:Comment})
class CommentController extends BaseController {
 @Get('/') async getComments(@QueryParam('recipeId',{required:false,type:Number}) recipeId?:number){ return this.repository.find({where: recipeId?{recipeId}: {}}); }
 @Get('/details') async getById(@QueryParam('id',{required:true,type:Number}) id:number){ return await this.repository.findOneBy({id}) || {message:'Comment is not found'}; }
 @Post('/') @UseBefore(AuthMiddleware) async createComment(@Req() req:RequestWithUser,@Body({type:CreateCommentDto}) data:CreateCommentDto){ if(!(await recipeExists(data.recipeId))) return {message:'Recipe not found'}; return this.repository.save(this.repository.create({text:data.text,userId:req.user.id,recipeId:data.recipeId})); }
 @Patch('/update') @UseBefore(AuthMiddleware) async updateComment(@Req() req:RequestWithUser,@QueryParam('id',{required:true,type:Number}) id:number,@Body({type:UpdateCommentDto}) data:UpdateCommentDto){ const c:any=await this.repository.findOneBy({id}); if(!c) return {message:'Comment is not found'}; if(c.userId!==req.user.id) return {message:'You can update only your own comments'}; this.repository.merge(c,data); return this.repository.save(c); }
 @Delete('/delete') @UseBefore(AuthMiddleware) async deleteComment(@Req() req:RequestWithUser,@QueryParam('id',{required:true,type:Number}) id:number){ const c:any=await this.repository.findOneBy({id}); if(!c) return {message:'Comment is not found'}; if(c.userId!==req.user.id) return {message:'You can delete only your own comments'}; await this.repository.remove(c); return {message:'Comment deleted'}; }
}
export default CommentController;
