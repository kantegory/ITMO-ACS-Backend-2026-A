import { Body, Delete, ForbiddenError, Get, Param, Patch, Post, QueryParam, Req, UseBefore } from 'routing-controllers';
import { OpenAPI } from 'routing-controllers-openapi';
import { IsEmail, IsOptional, IsString, MinLength } from 'class-validator';
import EntityController from '../common/entity-controller';
import BaseController from '../common/base-controller';
import { User } from '../models/user.entity';
import AuthMiddleware, { RequestWithUser } from '../middlewares/auth.middleware';
import hashPassword from '../utils/hash-password';
class UserCreateDto { @IsString() username:string; @IsEmail() email:string; @IsString() @MinLength(6) password:string; @IsOptional() @IsString() firstName?:string; @IsOptional() @IsString() lastName?:string; @IsOptional() @IsString() avatarUrl?:string; @IsOptional() @IsString() bio?:string; }
class UserUpdateDto { @IsOptional() @IsString() username?:string; @IsOptional() @IsEmail() email?:string; @IsOptional() @IsString() @MinLength(6) password?:string; @IsOptional() @IsString() firstName?:string; @IsOptional() @IsString() lastName?:string; @IsOptional() @IsString() avatarUrl?:string; @IsOptional() @IsString() bio?:string; }
@EntityController({baseRoute:'/users', entity:User})
class UserController extends BaseController {
 @Get('/') async getAll(){ return this.repository.find(); }
 @Get('/me') @UseBefore(AuthMiddleware) async me(@Req() req:RequestWithUser){ return this.repository.findOneBy({id:req.user.id}); }
 @Get('/details') async getById(@QueryParam('id',{required:true,type:Number}) id:number){ return await this.repository.findOneBy({id}) || {message:'User is not found'}; }
 @Post('/')
 async create(@Body({type:UserCreateDto}) data:UserCreateDto) {
  const user = this.repository.create({ ...data, password: hashPassword(data.password) });
  const { password, ...profile } = await this.repository.save(user);
  return profile;
 }
 @Patch('/update') @UseBefore(AuthMiddleware)
 async update(@Req() req:RequestWithUser,@QueryParam('id',{required:true,type:Number}) id:number,@Body({type:UserUpdateDto}) data:UserUpdateDto) {
  if (req.user.id !== id) throw new ForbiddenError('You can update only your own profile');
  const user = await this.repository.findOneBy({ id });
  if (!user) return { message: 'User is not found' };
  const { password: newPassword, ...profileData } = data;
  this.repository.merge(user, profileData);
  if (newPassword) user.password = hashPassword(newPassword);
  const { password, ...profile } = await this.repository.save(user);
  return profile;
 }
 @Delete('/delete') @UseBefore(AuthMiddleware)
 async delete(@Req() req:RequestWithUser,@QueryParam('id',{required:true,type:Number}) id:number) {
  if (req.user.id !== id) throw new ForbiddenError('You can delete only your own profile');
  const user = await this.repository.findOneBy({ id });
  if (!user) return { message: 'User is not found' };
  await this.repository.remove(user);
  return { message: 'User deleted' };
 }
 @Get('/internal/:id') @OpenAPI({summary:'Internal get user by id'}) async internalUser(@Param('id') id:number){ const user:any=await this.repository.findOneBy({id}); if(!user) return {message:'User is not found'}; return {id:user.id, username:user.username, firstName:user.firstName, lastName:user.lastName, avatarUrl:user.avatarUrl}; }
}
export default UserController;
