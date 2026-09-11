import { IsOptional, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateTableDto {
    @IsNumber()
    @Type(() => Number)
    restaurant_id!: number;

    @IsNumber()
    @Type(() => Number)
    capacity!: number;
}

export class UpdateTableDto {
    @IsOptional()
    @IsNumber()
    @Type(() => Number)
    capacity?: number;
}
