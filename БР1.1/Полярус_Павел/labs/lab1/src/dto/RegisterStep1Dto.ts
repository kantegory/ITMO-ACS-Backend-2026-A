import { IsEmail, IsEnum, IsOptional, IsString, MinLength } from 'class-validator';
import { UserRole } from '../entities/User';

export class RegisterStep1Dto {
  @IsEmail()
  email: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsString()
  @MinLength(8)
  password: string;

  @IsEnum([UserRole.SEEKER, UserRole.EMPLOYER])
  role: UserRole.SEEKER | UserRole.EMPLOYER;
}
