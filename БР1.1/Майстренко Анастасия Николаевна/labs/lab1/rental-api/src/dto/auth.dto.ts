import {
    IsString,
    IsEmail,
    MinLength,
    IsOptional,
    IsEnum,
} from 'class-validator';
import { UserRole } from '../models/enums';

export class RegisterDto {
    @IsEmail()
    email: string;

    @IsString()
    @MinLength(8)
    password: string;

    @IsString()
    @MinLength(1)
    firstName: string;

    @IsString()
    @MinLength(1)
    lastName: string;

    @IsOptional()
    @IsString()
    phone?: string;

    @IsOptional()
    @IsEnum(UserRole)
    role?: UserRole;
}

export class LoginDto {
    @IsEmail()
    email: string;

    @IsString()
    password: string;
}

export class RefreshDto {
    @IsString()
    refreshToken: string;
}
