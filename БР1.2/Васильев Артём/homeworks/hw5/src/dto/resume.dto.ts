import { Type } from 'class-transformer';
import {
    ArrayMinSize,
    IsArray,
    IsBoolean,
    IsDateString,
    IsEnum,
    IsNumber,
    IsOptional,
    IsString,
    MaxLength,
    Min,
    ValidateNested,
} from 'class-validator';

import { EmploymentType } from '../models/enums/employment-type.enum';
import { WorkFormat } from '../models/enums/work-format.enum';
import { SearchDto } from './common.dto';

export class ResumeExperienceItemDto {
    @IsString()
    @MaxLength(255)
    @Type(() => String)
    company_name: string;

    @IsString()
    @MaxLength(255)
    @Type(() => String)
    position: string;

    @IsString()
    description: string;

    @IsDateString()
    start_date: string;

    @IsOptional()
    @IsDateString()
    end_date?: string;

    @Type(() => Number)
    @IsNumber()
    @Min(1)
    months_count: number;
}

export class CreateResumeDto {
    @IsString()
    @MaxLength(255)
    @Type(() => String)
    title: string;

    @IsString()
    @MaxLength(255)
    @Type(() => String)
    desired_position: string;

    @IsString()
    about_me: string;

    @IsString()
    skills: string;

    @IsString()
    education: string;

    @Type(() => Number)
    @IsNumber()
    @Min(0)
    salary_expectation: number;

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

    @IsArray()
    @ArrayMinSize(1)
    @ValidateNested({ each: true })
    @Type(() => ResumeExperienceItemDto)
    experiences: ResumeExperienceItemDto[];
}

export class UpdateResumeDto {
    @IsOptional()
    @IsString()
    @MaxLength(255)
    @Type(() => String)
    title?: string;

    @IsOptional()
    @IsString()
    @MaxLength(255)
    @Type(() => String)
    desired_position?: string;

    @IsOptional()
    @IsString()
    about_me?: string;

    @IsOptional()
    @IsString()
    skills?: string;

    @IsOptional()
    @IsString()
    education?: string;

    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    @Min(0)
    salary_expectation?: number;

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

    @IsOptional()
    @IsArray()
    @ArrayMinSize(1)
    @ValidateNested({ each: true })
    @Type(() => ResumeExperienceItemDto)
    experiences?: ResumeExperienceItemDto[];
}

export class ResumeListQueryDto extends SearchDto {
    @IsOptional()
    @IsString()
    @Type(() => String)
    desired_position?: string;

    @IsOptional()
    @IsString()
    @Type(() => String)
    city?: string;

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
    salary_expectation_from?: number;

    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    @Min(0)
    salary_expectation_to?: number;

    @IsOptional()
    @Type(() => Boolean)
    @IsBoolean()
    is_published?: boolean;
}
