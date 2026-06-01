import { Type } from 'class-transformer';
import {
    IsInt,
    IsOptional,
    IsString,
    IsUrl,
    MaxLength,
    Min,
} from 'class-validator';

import { SearchDto } from './common.dto';

export class CreateCompanyDto {
    @IsString()
    @MaxLength(255)
    @Type(() => String)
    title: string;

    @IsOptional()
    @IsString()
    description?: string;

    @IsOptional()
    @IsUrl()
    @MaxLength(255)
    @Type(() => String)
    website?: string;

    @IsOptional()
    @IsString()
    @MaxLength(255)
    @Type(() => String)
    industry_text?: string;

    @IsOptional()
    @IsString()
    @MaxLength(255)
    @Type(() => String)
    address?: string;

    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(0)
    employee_count?: number;
}

export class UpdateCompanyDto extends CreateCompanyDto {}

export class CompanyListQueryDto extends SearchDto {
    @IsOptional()
    @IsString()
    @Type(() => String)
    title?: string;
}
