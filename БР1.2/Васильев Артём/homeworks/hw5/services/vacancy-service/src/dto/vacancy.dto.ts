import { Type } from 'class-transformer';
import {
    IsBoolean,
    IsEnum,
    IsNumber,
    IsOptional,
    IsString,
    IsUUID,
    MaxLength,
    Min,
} from 'class-validator';

import { EmploymentType } from '../models/enums/employment-type.enum';
import { WorkFormat } from '../models/enums/work-format.enum';
import { SearchDto } from './common.dto';

export class CreateVacancyDto {
    @IsUUID()
    @Type(() => String)
    company_id: string;

    @IsUUID()
    @Type(() => String)
    employer_profile_id: string;

    @IsUUID()
    @Type(() => String)
    industry_id: string;

    @IsUUID()
    @Type(() => String)
    experience_level_id: string;

    @IsString()
    @MaxLength(255)
    @Type(() => String)
    title: string;

    @IsString()
    description: string;

    @IsString()
    requirements: string;

    @IsString()
    responsibilities: string;

    @Type(() => Number)
    @IsNumber()
    @Min(0)
    salary_from: number;

    @Type(() => Number)
    @IsNumber()
    @Min(0)
    salary_to: number;

    @IsString()
    @MaxLength(255)
    @Type(() => String)
    city: string;

    @IsEnum(EmploymentType)
    employment_type: EmploymentType;

    @IsEnum(WorkFormat)
    work_format: WorkFormat;

    @Type(() => Boolean)
    @IsBoolean()
    is_published: boolean;
}

export class UpdateVacancyDto {
    @IsOptional()
    @IsUUID()
    @Type(() => String)
    company_id?: string;

    @IsOptional()
    @IsUUID()
    @Type(() => String)
    employer_profile_id?: string;

    @IsOptional()
    @IsUUID()
    @Type(() => String)
    industry_id?: string;

    @IsOptional()
    @IsUUID()
    @Type(() => String)
    experience_level_id?: string;

    @IsOptional()
    @IsString()
    @MaxLength(255)
    @Type(() => String)
    title?: string;

    @IsOptional()
    @IsString()
    description?: string;

    @IsOptional()
    @IsString()
    requirements?: string;

    @IsOptional()
    @IsString()
    responsibilities?: string;

    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    @Min(0)
    salary_from?: number;

    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    @Min(0)
    salary_to?: number;

    @IsOptional()
    @IsString()
    @MaxLength(255)
    @Type(() => String)
    city?: string;

    @IsOptional()
    @IsEnum(EmploymentType)
    employment_type?: EmploymentType;

    @IsOptional()
    @IsEnum(WorkFormat)
    work_format?: WorkFormat;

    @IsOptional()
    @Type(() => Boolean)
    @IsBoolean()
    is_published?: boolean;
}

export class VacancyListQueryDto extends SearchDto {
    @IsOptional()
    @IsString()
    @Type(() => String)
    city?: string;

    @IsOptional()
    @IsUUID()
    @Type(() => String)
    industry_id?: string;

    @IsOptional()
    @IsUUID()
    @Type(() => String)
    experience_level_id?: string;

    @IsOptional()
    @IsEnum(EmploymentType)
    employment_type?: EmploymentType;

    @IsOptional()
    @IsEnum(WorkFormat)
    work_format?: WorkFormat;

    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    @Min(0)
    salary_from?: number;

    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    @Min(0)
    salary_to?: number;

    @IsOptional()
    @Type(() => Boolean)
    @IsBoolean()
    is_published?: boolean;
}
