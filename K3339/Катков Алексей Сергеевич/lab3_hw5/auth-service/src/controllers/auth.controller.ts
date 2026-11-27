import { Body, Post } from 'routing-controllers';
import { OpenAPI } from 'routing-controllers-openapi';
import { IsEmail, IsString, MinLength } from 'class-validator';
import { Type } from 'class-transformer';
import jwt from 'jsonwebtoken';
import SETTINGS from '../config/settings';
import EntityController from '../common/entity-controller';
import BaseController from '../common/base-controller';
import { User } from '../models/user.entity';
import checkPassword from '../utils/check-password';
import hashPassword from '../utils/hash-password';
class RegisterDto { @IsString() @Type(() => String) username:string; @IsEmail() email:string; @IsString() @MinLength(6) password:string; @IsString() firstName:string; @IsString() lastName:string; }
class LoginDto { @IsEmail() email:string; @IsString() password:string; }
@EntityController({ baseRoute: '/auth', entity: User })
class AuthController extends BaseController {
 @Post('/register') @OpenAPI({summary:'Register new user'})
 async register(@Body({type:RegisterDto}) data:RegisterDto) {
  const exists = await this.repository.findOne({ where:[{email:data.email},{username:data.username}] });
  if (exists) return { message:'User with this email or username already exists' };
  const user = this.repository.create({...data, password: hashPassword(data.password)});
  const saved:any = await this.repository.save(user);
  const accessToken = jwt.sign({user:{id:saved.id}}, SETTINGS.JWT_SECRET_KEY, {expiresIn: SETTINGS.JWT_ACCESS_TOKEN_LIFETIME});
  return {accessToken, user:{id:saved.id, username:saved.username, email:saved.email, firstName:saved.firstName, lastName:saved.lastName}};
 }
 @Post('/login') @OpenAPI({summary:'Login'})
 async login(@Body({type:LoginDto}) data:LoginDto) {
  const user:any = await this.repository.findOneBy({email:data.email});
  if (!user || !checkPassword(user.password, data.password)) return { message:'Password or email is incorrect' };
  const accessToken = jwt.sign({user:{id:user.id}}, SETTINGS.JWT_SECRET_KEY, {expiresIn: SETTINGS.JWT_ACCESS_TOKEN_LIFETIME});
  return {accessToken, user:{id:user.id, username:user.username, email:user.email, firstName:user.firstName, lastName:user.lastName}};
 }
}
export default AuthController;
