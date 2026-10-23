import { Transform, Type } from 'class-transformer';
import {
    ArrayMaxSize,
    IsArray,
    IsBoolean,
    IsIn,
    IsInt,
    IsOptional,
    IsString,
    IsUUID,
    Max,
    MaxLength,
    Min,
    MinLength,
    ValidateNested,
} from 'class-validator';

import { PageQuery } from '@jobsearch/common';
import { ToBoolean, Trim } from '@jobsearch/common';

export class SearchVacanciesQuery extends PageQuery {
    @IsOptional()
    @Trim()
    @IsString()
    @MaxLength(200)
    q?: string;

    @IsOptional()
    @IsUUID()
    industry_id?: string;

    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(0)
    salary_min?: number;

    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(0)
    salary_max?: number;

    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(0)
    experience_years?: number;

    // skill_ids=id1,id2 -> ['id1', 'id2']
    @IsOptional()
    @Transform(({ value }) =>
        typeof value === 'string' ? value.split(',').filter(Boolean) : value,
    )
    @IsArray()
    @ArrayMaxSize(50)
    @IsUUID('all', { each: true })
    skill_ids?: string[];

    @IsOptional()
    @IsIn(['any', 'all'])
    skills_match?: 'any' | 'all';

    @IsOptional()
    @IsUUID()
    company_id?: string;

    @IsOptional()
    @IsIn(['created_at_desc', 'salary_desc', 'salary_asc'])
    sort?: 'created_at_desc' | 'salary_desc' | 'salary_asc';
}

export class CompanyVacanciesQuery extends PageQuery {
    @IsOptional()
    @ToBoolean()
    @IsBoolean()
    is_active?: boolean;
}

export class CreateVacancyDto {
    @IsUUID()
    company_id: string;

    @IsUUID()
    industry_id: string;

    @Trim()
    @IsString()
    @MinLength(1)
    @MaxLength(200)
    title: string;

    @IsString()
    @MinLength(1)
    @MaxLength(10000)
    description: string;

    @IsOptional()
    @IsString()
    @MaxLength(10000)
    requirements?: string | null;

    @IsOptional()
    @IsInt()
    @Min(0)
    salary_from?: number | null;

    @IsOptional()
    @IsInt()
    @Min(0)
    salary_to?: number | null;

    @IsOptional()
    @IsInt()
    @Min(0)
    @Max(50)
    min_experience_years?: number;

    @IsOptional()
    @IsBoolean()
    is_active?: boolean;
}

export class UpdateVacancyDto {
    @IsOptional()
    @IsUUID()
    industry_id?: string;

    @IsOptional()
    @Trim()
    @IsString()
    @MinLength(1)
    @MaxLength(200)
    title?: string;

    @IsOptional()
    @IsString()
    @MinLength(1)
    @MaxLength(10000)
    description?: string;

    @IsOptional()
    @IsString()
    @MaxLength(10000)
    requirements?: string | null;

    @IsOptional()
    @IsInt()
    @Min(0)
    salary_from?: number | null;

    @IsOptional()
    @IsInt()
    @Min(0)
    salary_to?: number | null;

    @IsOptional()
    @IsInt()
    @Min(0)
    @Max(50)
    min_experience_years?: number;

    @IsOptional()
    @IsBoolean()
    is_active?: boolean;
}

export class VacancySkillInputDto {
    @IsUUID()
    skill_id: string;

    @IsOptional()
    @IsBoolean()
    is_required?: boolean;
}

export class SetVacancySkillsDto {
    @IsArray()
    @ArrayMaxSize(50)
    @ValidateNested({ each: true })
    @Type(() => VacancySkillInputDto)
    skills: VacancySkillInputDto[];
}

