import { IsOptional, IsString, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateMenuDto {
    @IsNumber()
    @Type(() => Number)
    restaurant_id!: number;

    @IsString()
    @Type(() => String)
    name!: string;
}

export class CreateMenuItemDto {
    @IsNumber()
    @Type(() => Number)
    menu_id!: number;

    @IsString()
    @Type(() => String)
    name!: string;

    @IsOptional()
    @IsString()
    @Type(() => String)
    description?: string;

    @IsOptional()
    @Type(() => Number)
    price?: number;
}

export class UpdateMenuItemDto {
    @IsOptional()
    @IsString()
    @Type(() => String)
    name?: string;

    @IsOptional()
    @IsString()
    @Type(() => String)
    description?: string;

    @IsOptional()
    @Type(() => Number)
    price?: number;
}
