import {
  Body,
  Get,
  Param,
  Post,
  QueryParam,
  Req,
  UseBefore,
  NotFoundError,
  BadRequestError,
} from 'routing-controllers';
import { Type } from 'class-transformer';
import { IsArray, IsInt, IsOptional, IsString, Min, IsUrl } from 'class-validator';

import EntityController from '../common/entity-controller';
import BaseController from '../common/base-controller';

import { Workout } from '../models/workout.entity';
import { DifficultyLevel } from '../models/difficulty-level.entity';
import { WorkoutType } from '../models/workout-type.entity';
import { User } from '../models/user.entity';

import authMiddleware, { RequestWithUser } from '../middlewares/auth.middleware';

class CreateWorkoutDto {
  @IsString()
  @Type(() => String)
  title!: string;

  @IsOptional()
  @IsString()
  @Type(() => String)
  description?: string;

  @IsOptional()
  @IsString()
  @Type(() => String)
  instructions?: string;

  @IsInt()
  @Min(1)
  @Type(() => Number)
  durationMin!: number;

  @IsOptional()
  @IsUrl()
  @Type(() => String)
  videoUrl?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Type(() => Number)
  caloriesEstimate?: number;

  @IsInt()
  @Min(1)
  @Type(() => Number)
  difficultyLevelId!: number;

  @IsArray()
  @Type(() => Number)
  typeIds!: number[];
}

@EntityController({
  baseRoute: '/workouts',
  entity: Workout,
})
class WorkoutController extends BaseController {
  @Get('/')
  async getWorkouts(
    @QueryParam('q') q?: string,
    @QueryParam('difficultyLevelId') difficultyLevelId?: string,
    @QueryParam('typeIds') typeIds?: string,
    @QueryParam('durationMinFrom') durationMinFrom?: string,
    @QueryParam('durationMinTo') durationMinTo?: string,
    @QueryParam('page') page?: string,
    @QueryParam('pageSize') pageSize?: string,
    @QueryParam('sortBy') sortBy?: string,
    @QueryParam('sortOrder') sortOrder?: string,
  ) {
    const qb = this.repository
      .createQueryBuilder('workout')
      .leftJoinAndSelect('workout.difficultyLevel', 'difficultyLevel')
      .leftJoinAndSelect('workout.types', 'types')
      .distinct(true);

    if (q) {
      qb.andWhere(
        '(LOWER(workout.title) LIKE LOWER(:q) OR LOWER(COALESCE(workout.description, \'\')) LIKE LOWER(:q))',
        { q: `%${q}%` },
      );
    }

    if (difficultyLevelId) {
      qb.andWhere('workout.difficultyLevelId = :difficultyLevelId', {
        difficultyLevelId: Number(difficultyLevelId),
      });
    }

    if (durationMinFrom) {
      qb.andWhere('workout.durationMin >= :durationMinFrom', {
        durationMinFrom: Number(durationMinFrom),
      });
    }

    if (durationMinTo) {
      qb.andWhere('workout.durationMin <= :durationMinTo', {
        durationMinTo: Number(durationMinTo),
      });
    }

    if (typeIds) {
      const parsedTypeIds = typeIds
        .split(',')
        .map((id) => Number(id.trim()))
        .filter((id) => !Number.isNaN(id));

      if (parsedTypeIds.length > 0) {
        qb.andWhere('types.id IN (:...typeIds)', { typeIds: parsedTypeIds });
      }
    }

    const allowedSortBy = ['createdAt', 'durationMin', 'title'];
    const finalSortBy = allowedSortBy.includes(sortBy || '') ? sortBy! : 'createdAt';
    const finalSortOrder = (sortOrder || 'desc').toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    qb.orderBy(`workout.${finalSortBy}`, finalSortOrder as 'ASC' | 'DESC');

    const pageNumber = Math.max(Number(page) || 1, 1);
    const pageSizeNumber = Math.min(Math.max(Number(pageSize) || 20, 1), 100);

    qb.skip((pageNumber - 1) * pageSizeNumber).take(pageSizeNumber);

    const [items, totalItems] = await qb.getManyAndCount();

    return {
      items,
      pagination: {
        page: pageNumber,
        pageSize: pageSizeNumber,
        totalItems,
        totalPages: Math.ceil(totalItems / pageSizeNumber),
      },
    };
  }

  @Get('/:id')
  async getWorkoutById(@Param('id') id: number) {
    const workout = await this.repository.findOne({
      where: { id },
      relations: ['difficultyLevel', 'types'],
    });

    if (!workout) {
      throw new NotFoundError('Workout not found');
    }

    return { workout };
  }

  @Post('/')
  @UseBefore(authMiddleware)
  async createWorkout(
    @Req() request: RequestWithUser,
    @Body({ type: CreateWorkoutDto }) body: CreateWorkoutDto,
  ) {
    const difficultyLevelRepository = this.repository.manager.getRepository(DifficultyLevel);
    const workoutTypeRepository = this.repository.manager.getRepository(WorkoutType);
    const userRepository = this.repository.manager.getRepository(User);

    const difficultyLevel = await difficultyLevelRepository.findOneBy({
      id: body.difficultyLevelId,
    });

    if (!difficultyLevel) {
      throw new BadRequestError('Difficulty level not found');
    }

    if (!body.typeIds || body.typeIds.length === 0) {
      throw new BadRequestError('At least one workout type is required');
    }

    const workoutTypes = await workoutTypeRepository.findByIds(body.typeIds);

    if (workoutTypes.length !== body.typeIds.length) {
      throw new BadRequestError('One or more workout types were not found');
    }

    const author = await userRepository.findOneBy({ id: request.user.id });

    if (!author) {
      throw new NotFoundError('Author not found');
    }

    const workout = this.repository.create({
      title: body.title,
      description: body.description,
      instructions: body.instructions,
      durationMin: body.durationMin,
      videoUrl: body.videoUrl,
      caloriesEstimate: body.caloriesEstimate,
      difficultyLevelId: body.difficultyLevelId,
      authorId: author.id,
      types: workoutTypes,
    });

    const savedWorkout = await this.repository.save(workout);

    const fullWorkout = await this.repository.findOne({
      where: { id: savedWorkout.id },
      relations: ['difficultyLevel', 'types'],
    });

    return { workout: fullWorkout };
  }
}

export default WorkoutController;