import { Type } from 'class-transformer';
import {
    ArrayMaxSize,
    IsArray,
    IsBoolean,
    IsInt,
    IsISO8601,
    IsOptional,
    IsString,
    IsUUID,
    Max,
    MaxLength,
    Min,
    MinLength,
} from 'class-validator';

import { PageQuery } from '@jobsearch/common';
import { ToBoolean, Trim } from '@jobsearch/common';

export class MyResumesQuery extends PageQuery {
    @IsOptional()
    @ToBoolean()
    @IsBoolean()
    is_published?: boolean;
}

export class CreateResumeDto {
    @Trim()
    @IsString()
    @MinLength(1)
    @MaxLength(200)
    title: string;

    @IsOptional()
    @IsString()
    @MaxLength(4000)
    summary?: string | null;

    @IsUUID()
    industry_id: string;

    @IsOptional()
    @IsInt()
    @Min(0)
    salary_exp_from?: number | null;

    @IsOptional()
    @IsInt()
    @Min(0)
    salary_exp_to?: number | null;

    @IsOptional()
    @IsBoolean()
    is_published?: boolean;
}

export class UpdateResumeDto {
    @IsOptional()
    @Trim()
    @IsString()
    @MinLength(1)
    @MaxLength(200)
    title?: string;

    @IsOptional()
    @IsString()
    @MaxLength(4000)
    summary?: string | null;

    @IsOptional()
    @IsUUID()
    industry_id?: string;

    @IsOptional()
    @IsInt()
    @Min(0)
    salary_exp_from?: number | null;

    @IsOptional()
    @IsInt()
    @Min(0)
    salary_exp_to?: number | null;

    @IsOptional()
    @IsBoolean()
    is_published?: boolean;
}

export class CreateExperienceDto {
    @Trim()
    @IsString()
    @MinLength(1)
    @MaxLength(200)
    company_name: string;

    @Trim()
    @IsString()
    @MinLength(1)
    @MaxLength(200)
    position: string;

    @IsOptional()
    @IsString()
    @MaxLength(4000)
    description?: string | null;

    @IsISO8601({ strict: true })
    start_date: string;

    @IsOptional()
    @IsISO8601({ strict: true })
    end_date?: string | null;
}

export class UpdateExperienceDto {
    @IsOptional()
    @Trim()
    @IsString()
    @MinLength(1)
    @MaxLength(200)
    company_name?: string;

    @IsOptional()
    @Trim()
    @IsString()
    @MinLength(1)
    @MaxLength(200)
    position?: string;

    @IsOptional()
    @IsString()
    @MaxLength(4000)
    description?: string | null;

    @IsOptional()
    @IsISO8601({ strict: true })
    start_date?: string;

    @IsOptional()
    @IsISO8601({ strict: true })
    end_date?: string | null;
}

export class CreateEducationDto {
    @Trim()
    @IsString()
    @MinLength(1)
    @MaxLength(200)
    institution: string;

    @IsOptional()
    @Trim()
    @IsString()
    @MaxLength(100)
    degree?: string | null;

    @IsOptional()
    @Trim()
    @IsString()
    @MaxLength(200)
    field_of_study?: string | null;

    @IsInt()
    @Min(1950)
    @Max(2100)
    start_year: number;

    @IsOptional()
    @IsInt()
    @Min(1950)
    @Max(2100)
    end_year?: number | null;
}

export class UpdateEducationDto {
    @IsOptional()
    @Trim()
    @IsString()
    @MinLength(1)
    @MaxLength(200)
    institution?: string;

    @IsOptional()
    @Trim()
    @IsString()
    @MaxLength(100)
    degree?: string | null;

    @IsOptional()
    @Trim()
    @IsString()
    @MaxLength(200)
    field_of_study?: string | null;

    @IsOptional()
    @IsInt()
    @Min(1950)
    @Max(2100)
    start_year?: number;

    @IsOptional()
    @IsInt()
    @Min(1950)
    @Max(2100)
    end_year?: number | null;
}

export class SetSkillsDto {
    @IsArray()
    @ArrayMaxSize(50)
    @IsUUID('all', { each: true })
    skill_ids: string[];
}
