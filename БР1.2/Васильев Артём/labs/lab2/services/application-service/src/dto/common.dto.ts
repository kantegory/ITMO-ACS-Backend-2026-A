import { Type } from 'class-transformer';
import {
    IsBoolean,
    IsInt,
    IsOptional,
    IsString,
    Max,
    Min,
} from 'class-validator';

export class PaginationDto {
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    page?: number;

    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    @Max(100)
    limit?: number;
}

export class SearchDto extends PaginationDto {
    @IsOptional()
    @IsString()
    search?: string;
}

export class PublishedFilterDto {
    @IsOptional()
    @Type(() => Boolean)
    @IsBoolean()
    is_published?: boolean;
}
