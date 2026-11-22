import { IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateUserDto {
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
