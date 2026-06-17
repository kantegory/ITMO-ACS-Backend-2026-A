import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import { SkillLevel } from '../entities/ResumeSkill';

export class CreateResumeDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsOptional()
  @IsString()
  summary?: string;

  @IsOptional()
  @IsBoolean()
  isPublished?: boolean;
}

export class UpdateResumeDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  title?: string;

  @IsOptional()
  @IsString()
  summary?: string;

  @IsOptional()
  @IsBoolean()
  isPublished?: boolean;
}

export class AddResumeSkillDto {
  @IsUUID()
  skillId: string;

  @IsEnum(SkillLevel)
  level: SkillLevel;
}

export class CreateWorkExperienceDto {
  @IsString()
  @IsNotEmpty()
  companyName: string;

  @IsString()
  @IsNotEmpty()
  role: string;

  @IsDateString()
  startDate: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsBoolean()
  isCurrent?: boolean;
}

export class UpdateWorkExperienceDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  companyName?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  role?: string;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsBoolean()
  isCurrent?: boolean;
}

export class CreateEducationDto {
  @IsUUID()
  degreeTypeId: string;

  @IsString()
  @IsNotEmpty()
  institution: string;

  @IsOptional()
  @IsString()
  programName?: string;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;
}

export class UpdateEducationDto {
  @IsOptional()
  @IsUUID()
  degreeTypeId?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  institution?: string;

  @IsOptional()
  @IsString()
  programName?: string;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;
}
