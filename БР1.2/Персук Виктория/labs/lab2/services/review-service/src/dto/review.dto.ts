import { IsOptional, IsString, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateReviewDto {
    @IsNumber()
    @Type(() => Number)
    restaurant_id!: number;

    @IsNumber()
    @Type(() => Number)
    rating!: number;

    @IsOptional()
    @IsString()
    @Type(() => String)
    comment?: string;
}

export class UpdateReviewDto {
    @IsOptional()
    @IsNumber()
    @Type(() => Number)
    rating?: number;

    @IsOptional()
    @IsString()
    @Type(() => String)
    comment?: string;
}
