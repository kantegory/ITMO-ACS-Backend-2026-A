import { Type } from 'class-transformer';
import {
    IsEmail,
    IsEnum,
    IsOptional,
    IsPhoneNumber,
    IsString,
    MaxLength,
    MinLength,
} from 'class-validator';

import { UserRole } from '../models/enums/user-role.enum';

export class RegisterDto {
    @IsEnum([UserRole.APPLICANT, UserRole.EMPLOYER])
    role: UserRole.APPLICANT | UserRole.EMPLOYER;

    @IsString()
    @MaxLength(255)
    @Type(() => String)
    first_name: string;

    @IsString()
    @MaxLength(255)
    @Type(() => String)
    last_name: string;

    @IsOptional()
    @IsString()
    @MaxLength(255)
    @Type(() => String)
    middle_name?: string;

    @IsEmail()
    @MaxLength(255)
    @Type(() => String)
    email: string;

    @IsString()
    @MinLength(8)
    @MaxLength(255)
    @Type(() => String)
    password: string;

    @IsString()
    @MaxLength(50)
    @Type(() => String)
    phone: string;
}

export class LoginDto {
    @IsEmail()
    @MaxLength(255)
    @Type(() => String)
    email: string;

    @IsString()
    @MinLength(8)
    @MaxLength(255)
    @Type(() => String)
    password: string;
}
