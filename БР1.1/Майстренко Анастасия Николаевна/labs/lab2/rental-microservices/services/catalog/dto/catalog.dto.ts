import { IsString, IsOptional, IsEnum, IsNumber, IsInt, Min, IsArray } from 'class-validator';
import { PropertyType, PropertyStatus } from '../models/property.entity';

export class CreatePropertyDto {
    @IsString() title: string;
    @IsOptional() @IsString() description?: string;
    @IsEnum(PropertyType) propertyType: PropertyType;
    @IsNumber() @Min(0) pricePerDay: number;
    @IsString() city: string;
    @IsOptional() @IsString() address?: string;
    @IsOptional() @IsInt() @Min(0) rooms?: number;
    @IsOptional() @IsArray() amenityIds?: number[];
}

export class CreateAmenityDto {
    @IsString() name: string;
    @IsOptional() @IsString() icon?: string;
}

export class UpdateStatusDto {
    @IsEnum(PropertyStatus) status: PropertyStatus;
}
