import { IsOptional, IsString, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';

import { PriceCategory } from '../common/enums';

export class CreateRestaurantDto {
    @IsString()
    @Type(() => String)
    name!: string;

    @IsOptional()
    @IsString()
    @Type(() => String)
    description?: string;

    @IsOptional()
    @IsString()
    @Type(() => String)
    address?: string;

    @IsOptional()
    @IsString()
    @Type(() => String)
    city?: string;

    @IsOptional()
    price?: PriceCategory;
}

export class UpdateRestaurantDto {
    @IsOptional()
    @IsString()
    @Type(() => String)
    name?: string;

    @IsOptional()
    @IsString()
    @Type(() => String)
    description?: string;

    @IsOptional()
    @IsString()
    @Type(() => String)
    address?: string;

    @IsOptional()
    @IsString()
    @Type(() => String)
    city?: string;

    @IsOptional()
    price?: PriceCategory;
}

export class AddStaffDto {
    @IsNumber()
    @Type(() => Number)
    user_id!: number;
}

export class CreateMenuDto {
    @IsString()
    @Type(() => String)
    name!: string;
}

export class CreatePhotoDto {
    @IsString()
    @Type(() => String)
    url!: string;
}
