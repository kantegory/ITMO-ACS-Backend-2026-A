import {
    IsString,
    IsOptional,
    IsEnum,
    IsNumber,
    IsInt,
    Min,
    IsArray,
} from 'class-validator';
import { PropertyType, PropertyStatus } from '../models/enums';

export class CreatePropertyDto {
    @IsString()
    title: string;

    @IsOptional()
    @IsString()
    description?: string;

    @IsEnum(PropertyType)
    propertyType: PropertyType;

    @IsNumber()
    @Min(0)
    pricePerDay: number;

    @IsString()
    city: string;

    @IsOptional()
    @IsString()
    address?: string;

    @IsOptional()
    @IsNumber()
    latitude?: number;

    @IsOptional()
    @IsNumber()
    longitude?: number;

    @IsOptional()
    @IsNumber()
    @Min(0)
    area?: number;

    @IsOptional()
    @IsInt()
    @Min(0)
    rooms?: number;

    @IsOptional()
    @IsArray()
    amenityIds?: number[];
}

export class UpdatePropertyDto {
    @IsOptional()
    @IsString()
    title?: string;

    @IsOptional()
    @IsString()
    description?: string;

    @IsOptional()
    @IsEnum(PropertyType)
    propertyType?: PropertyType;

    @IsOptional()
    @IsNumber()
    @Min(0)
    pricePerDay?: number;

    @IsOptional()
    @IsString()
    city?: string;

    @IsOptional()
    @IsString()
    address?: string;

    @IsOptional()
    @IsNumber()
    latitude?: number;

    @IsOptional()
    @IsNumber()
    longitude?: number;

    @IsOptional()
    @IsNumber()
    @Min(0)
    area?: number;

    @IsOptional()
    @IsInt()
    @Min(0)
    rooms?: number;

    @IsOptional()
    @IsEnum(PropertyStatus)
    status?: PropertyStatus;

    @IsOptional()
    @IsArray()
    amenityIds?: number[];
}
