import { Body, Get, Post, BadRequestError } from 'routing-controllers';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Matches, Min } from 'class-validator';

import EntityController from '../common/entity-controller';
import BaseController from '../common/base-controller';

import { DifficultyLevel } from '../models/difficulty-level.entity';
import { WorkoutType } from '../models/workout-type.entity';

class CreateDifficultyLevelDto {
  @IsString()
  @Type(() => String)
  name!: string;

  @IsInt()
  @Min(1)
  @Type(() => Number)
  sortOrder!: number;

  @IsOptional()
  @IsString()
  @Type(() => String)
  description?: string;
}

class CreateWorkoutTypeDto {
  @IsString()
  @Type(() => String)
  name!: string;

  @IsString()
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
  @Type(() => String)
  slug!: string;

  @IsOptional()
  @IsString()
  @Type(() => String)
  description?: string;
}

@EntityController({
  baseRoute: '/metadata',
  entity: DifficultyLevel,
})
class MetadataController extends BaseController {
  @Get('/difficulty-levels')
  async getDifficultyLevels() {
    const items = await this.repository.find({
      order: {
        sortOrder: 'ASC',
        id: 'ASC',
      },
    });

    return { items };
  }

  @Post('/difficulty-levels')
  async createDifficultyLevel(
    @Body({ type: CreateDifficultyLevelDto }) body: CreateDifficultyLevelDto,
  ) {
    const existing = await this.repository.findOneBy({ name: body.name });

    if (existing) {
      throw new BadRequestError('Difficulty level with this name already exists');
    }

    const level = this.repository.create({
      name: body.name,
      sortOrder: body.sortOrder,
      description: body.description,
    });

    const savedLevel = await this.repository.save(level);

    return { difficultyLevel: savedLevel };
  }

  @Get('/workout-types')
  async getWorkoutTypes() {
    const workoutTypeRepository = this.repository.manager.getRepository(WorkoutType);

    const items = await workoutTypeRepository.find({
      order: {
        id: 'ASC',
      },
    });

    return { items };
  }

  @Post('/workout-types')
  async createWorkoutType(
    @Body({ type: CreateWorkoutTypeDto }) body: CreateWorkoutTypeDto,
  ) {
    const workoutTypeRepository = this.repository.manager.getRepository(WorkoutType);

    const existingByName = await workoutTypeRepository.findOneBy({ name: body.name });
    if (existingByName) {
      throw new BadRequestError('Workout type with this name already exists');
    }

    const existingBySlug = await workoutTypeRepository.findOneBy({ slug: body.slug });
    if (existingBySlug) {
      throw new BadRequestError('Workout type with this slug already exists');
    }

    const workoutType = workoutTypeRepository.create({
      name: body.name,
      slug: body.slug,
      description: body.description,
    });

    const savedWorkoutType = await workoutTypeRepository.save(workoutType);

    return { workoutType: savedWorkoutType };
  }
}

export default MetadataController;