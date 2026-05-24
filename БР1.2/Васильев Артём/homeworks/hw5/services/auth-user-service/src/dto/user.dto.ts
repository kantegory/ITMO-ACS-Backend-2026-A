import { Type } from 'class-transformer';
import { IsEmail, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateUserDto {
    @IsOptional()
    @IsString()
    @MaxLength(255)
    @Type(() => String)
    first_name?: string;

    @IsOptional()
    @IsString()
    @MaxLength(255)
    @Type(() => String)
    last_name?: string;

    @IsOptional()
    @IsString()
    @MaxLength(255)
    @Type(() => String)
    middle_name?: string | null;

    @IsOptional()
    @IsEmail()
    @MaxLength(255)
    @Type(() => String)
    email?: string;

    @IsOptional()
    @IsString()
    @MaxLength(50)
    @Type(() => String)
    phone?: string;
}
