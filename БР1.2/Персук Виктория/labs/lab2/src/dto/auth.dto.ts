import { IsString, IsEmail, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

export class RegisterDto {
    @IsEmail()
    @Type(() => String)
    email!: string;

    @IsString()
    @Type(() => String)
    password!: string;

    @IsOptional()
    @IsString()
    @Type(() => String)
    first_name?: string;

    @IsOptional()
    @IsString()
    @Type(() => String)
    middle_name?: string;

    @IsOptional()
    @IsString()
    @Type(() => String)
    last_name?: string;

    @IsOptional()
    @IsString()
    @Type(() => String)
    phone?: string;
}

export class LoginDto {
    @IsEmail()
    @Type(() => String)
    email!: string;

    @IsString()
    @Type(() => String)
    password!: string;
}

export class LoginResponseDto {
    @IsString()
    @Type(() => String)
    accessToken!: string;
}

export class ErrorResponseDto {
    @IsString()
    @Type(() => String)
    message!: string;
}
