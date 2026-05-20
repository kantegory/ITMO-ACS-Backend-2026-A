import {
  IsArray,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  IsUrl,
  Max,
  Min,
} from "class-validator";
import { Type } from "class-transformer";
import { WorkoutLevel, WorkoutType } from "../entities/Workout";

export class CreateWorkoutDto {
  @IsString()
  title: string;

  @IsString()
  description: string;

  @IsOptional()
  @IsString()
  instructions?: string;

  @IsUrl({ require_tld: false })
  videoUrl: string;

  @IsOptional()
  @IsUrl({ require_tld: false })
  thumbnailUrl?: string;

  @IsEnum(WorkoutType)
  type: WorkoutType;

  @IsEnum(WorkoutLevel)
  level: WorkoutLevel;

  @IsInt()
  @Min(1)
  @Max(600)
  durationMinutes: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  caloriesBurned?: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  equipment?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  muscleGroups?: string[];

  @IsOptional()
  @IsUUID()
  categoryId?: string;
}

export class UpdateWorkoutDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  instructions?: string;

  @IsOptional()
  @IsUrl({ require_tld: false })
  videoUrl?: string;

  @IsOptional()
  @IsUrl({ require_tld: false })
  thumbnailUrl?: string;

  @IsOptional()
  @IsEnum(WorkoutType)
  type?: WorkoutType;

  @IsOptional()
  @IsEnum(WorkoutLevel)
  level?: WorkoutLevel;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(600)
  durationMinutes?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  caloriesBurned?: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  equipment?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  muscleGroups?: string[];

  @IsOptional()
  @IsUUID()
  categoryId?: string;
}

export class WorkoutFiltersDto {
  @IsOptional()
  @IsEnum(WorkoutType)
  type?: WorkoutType;

  @IsOptional()
  @IsEnum(WorkoutLevel)
  level?: WorkoutLevel;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  minDuration?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  maxDuration?: number;

  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;
}
