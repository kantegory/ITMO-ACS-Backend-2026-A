import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  ValidateNested,
  IsArray,
} from 'class-validator';
import { Type } from 'class-transformer';
import { SalaryType } from '../entities/Vacancy';

class VacancySkillInputDto {
  @IsUUID()
  skillId: string;
}

export class CreateVacancyDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  conditions?: string;

  @IsOptional()
  @IsString()
  requirementsNote?: string;

  @IsOptional()
  @IsUUID()
  cityId?: string;

  @IsOptional()
  @IsUUID()
  industryId?: string;

  @IsOptional()
  @IsUUID()
  employmentTypeId?: string;

  @IsEnum(SalaryType)
  salaryType: SalaryType;

  @IsOptional()
  @IsInt()
  salaryFixed?: number;

  @IsOptional()
  @IsInt()
  salaryMin?: number;

  @IsOptional()
  @IsInt()
  salaryMax?: number;

  @IsOptional()
  @IsString()
  currency?: string;

  @IsOptional()
  @IsInt()
  experienceYearsMin?: number;

  @IsOptional()
  @IsInt()
  experienceYearsMax?: number;

  @IsOptional()
  @IsBoolean()
  isRemote?: boolean;

  @IsOptional()
  @IsBoolean()
  isPublished?: boolean;

  @IsUUID()
  companyId: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => VacancySkillInputDto)
  skills?: VacancySkillInputDto[];
}

export class UpdateVacancyDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  conditions?: string;

  @IsOptional()
  @IsString()
  requirementsNote?: string;

  @IsOptional()
  @IsUUID()
  cityId?: string;

  @IsOptional()
  @IsUUID()
  industryId?: string;

  @IsOptional()
  @IsUUID()
  employmentTypeId?: string;

  @IsOptional()
  @IsEnum(SalaryType)
  salaryType?: SalaryType;

  @IsOptional()
  @IsInt()
  salaryFixed?: number;

  @IsOptional()
  @IsInt()
  salaryMin?: number;

  @IsOptional()
  @IsInt()
  salaryMax?: number;

  @IsOptional()
  @IsString()
  currency?: string;

  @IsOptional()
  @IsInt()
  experienceYearsMin?: number;

  @IsOptional()
  @IsInt()
  experienceYearsMax?: number;

  @IsOptional()
  @IsBoolean()
  isRemote?: boolean;

  @IsOptional()
  @IsBoolean()
  isPublished?: boolean;
}

export class AddVacancySkillDto {
  @IsUUID()
  skillId: string;
}
