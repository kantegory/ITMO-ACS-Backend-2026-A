import {
  Body,
  Get,
  Param,
  Patch,
  Post,
  QueryParam,
  Req,
  UseBefore,
  NotFoundError,
  BadRequestError,
} from 'routing-controllers';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsInt,
  IsOptional,
  IsString,
  Min,
  Max,
  IsDateString,
  ValidateNested,
  ArrayMinSize,
  IsIn,
} from 'class-validator';

import EntityController from '../common/entity-controller';
import BaseController from '../common/base-controller';

import { TrainingPlan } from '../models/training-plan.entity';
import { PlanWorkout } from '../models/plan-workout.entity';
import { UserTrainingPlan } from '../models/user-training-plan.entity';
import { DifficultyLevel } from '../models/difficulty-level.entity';
import { Workout } from '../models/workout.entity';
import { User } from '../models/user.entity';

import authMiddleware, { RequestWithUser } from '../middlewares/auth.middleware';

class CreatePlanWorkoutItemDto {
  @IsInt()
  @Min(1)
  @Type(() => Number)
  workoutId!: number;

  @IsInt()
  @Min(1)
  @Type(() => Number)
  weekNo!: number;

  @IsInt()
  @Min(1)
  @Type(() => Number)
  dayNo!: number;

  @IsInt()
  @Min(1)
  @Type(() => Number)
  orderNo!: number;

  @IsOptional()
  @IsString()
  @Type(() => String)
  note?: string;
}

class CreateTrainingPlanDto {
  @IsString()
  @Type(() => String)
  title!: string;

  @IsOptional()
  @IsString()
  @Type(() => String)
  description?: string;

  @IsInt()
  @Min(1)
  @Type(() => Number)
  difficultyLevelId!: number;

  @IsInt()
  @Min(1)
  @Type(() => Number)
  durationWeeks!: number;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreatePlanWorkoutItemDto)
  workouts!: CreatePlanWorkoutItemDto[];
}

class EnrollTrainingPlanDto {
  @IsDateString()
  @Type(() => String)
  startDate!: string;
}

class UpdateUserTrainingPlanDto {
  @IsOptional()
  @IsIn(['active', 'completed', 'cancelled'])
  @Type(() => String)
  status?: 'active' | 'completed' | 'cancelled';

  @IsOptional()
  @IsDateString()
  @Type(() => String)
  endDate?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  @Type(() => Number)
  progressPercent?: number;
}

@EntityController({
  baseRoute: '/training-plans',
  entity: TrainingPlan,
})
class TrainingPlanController extends BaseController {
  @Get('/')
  async getTrainingPlans(
    @QueryParam('q') q?: string,
    @QueryParam('difficultyLevelId') difficultyLevelId?: string,
    @QueryParam('durationWeeksFrom') durationWeeksFrom?: string,
    @QueryParam('durationWeeksTo') durationWeeksTo?: string,
    @QueryParam('page') page?: string,
    @QueryParam('pageSize') pageSize?: string,
  ) {
    const qb = this.repository
      .createQueryBuilder('trainingPlan')
      .leftJoinAndSelect('trainingPlan.difficultyLevel', 'difficultyLevel');

    if (q) {
      qb.andWhere(
        '(LOWER(trainingPlan.title) LIKE LOWER(:q) OR LOWER(COALESCE(trainingPlan.description, \'\')) LIKE LOWER(:q))',
        { q: `%${q}%` },
      );
    }

    if (difficultyLevelId) {
      qb.andWhere('trainingPlan.difficultyLevelId = :difficultyLevelId', {
        difficultyLevelId: Number(difficultyLevelId),
      });
    }

    if (durationWeeksFrom) {
      qb.andWhere('trainingPlan.durationWeeks >= :durationWeeksFrom', {
        durationWeeksFrom: Number(durationWeeksFrom),
      });
    }

    if (durationWeeksTo) {
      qb.andWhere('trainingPlan.durationWeeks <= :durationWeeksTo', {
        durationWeeksTo: Number(durationWeeksTo),
      });
    }

    qb.orderBy('trainingPlan.createdAt', 'DESC');

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
  async getTrainingPlanById(@Param('id') id: number) {
    const trainingPlan = await this.repository.findOne({
      where: { id },
      relations: [
        'difficultyLevel',
        'planWorkouts',
        'planWorkouts.workout',
        'planWorkouts.workout.difficultyLevel',
        'planWorkouts.workout.types',
      ],
    });

    if (!trainingPlan) {
      throw new NotFoundError('Training plan not found');
    }

    trainingPlan.planWorkouts.sort((a: PlanWorkout, b: PlanWorkout) => {
      if (a.weekNo !== b.weekNo) return a.weekNo - b.weekNo;
      if (a.dayNo !== b.dayNo) return a.dayNo - b.dayNo;
      return a.orderNo - b.orderNo;
    });

    return { trainingPlan };
  }

  @Post('/')
  @UseBefore(authMiddleware)
  async createTrainingPlan(
    @Req() request: RequestWithUser,
    @Body({ type: CreateTrainingPlanDto }) body: CreateTrainingPlanDto,
  ) {
    const difficultyLevelRepository = this.repository.manager.getRepository(DifficultyLevel);
    const workoutRepository = this.repository.manager.getRepository(Workout);
    const planWorkoutRepository = this.repository.manager.getRepository(PlanWorkout);
    const userRepository = this.repository.manager.getRepository(User);

    const difficultyLevel = await difficultyLevelRepository.findOneBy({
      id: body.difficultyLevelId,
    });

    if (!difficultyLevel) {
      throw new BadRequestError('Difficulty level not found');
    }

    const author = await userRepository.findOneBy({ id: request.user.id });
    if (!author) {
      throw new NotFoundError('Author not found');
    }

    const workoutIds = body.workouts.map((item) => item.workoutId);
    const uniqueWorkoutIds = [...new Set(workoutIds)];

    const foundWorkouts = await workoutRepository
      .createQueryBuilder('workout')
      .where('workout.id IN (:...ids)', { ids: uniqueWorkoutIds })
      .getMany();

    if (foundWorkouts.length !== uniqueWorkoutIds.length) {
      throw new BadRequestError('One or more workouts were not found');
    }

    const trainingPlan = this.repository.create({
      title: body.title,
      description: body.description,
      difficultyLevelId: body.difficultyLevelId,
      durationWeeks: body.durationWeeks,
      authorId: author.id,
    });

    const savedPlan = await this.repository.save(trainingPlan);

    const planWorkoutsToSave = body.workouts.map((item) =>
      planWorkoutRepository.create({
        planId: savedPlan.id,
        workoutId: item.workoutId,
        weekNo: item.weekNo,
        dayNo: item.dayNo,
        orderNo: item.orderNo,
        note: item.note,
      }),
    );

    await planWorkoutRepository.save(planWorkoutsToSave);

    const fullPlan = await this.repository.findOne({
      where: { id: savedPlan.id },
      relations: [
        'difficultyLevel',
        'planWorkouts',
        'planWorkouts.workout',
        'planWorkouts.workout.difficultyLevel',
        'planWorkouts.workout.types',
      ],
    });

    if (fullPlan?.planWorkouts) {
      fullPlan.planWorkouts.sort((a: PlanWorkout, b: PlanWorkout) => {
        if (a.weekNo !== b.weekNo) return a.weekNo - b.weekNo;
        if (a.dayNo !== b.dayNo) return a.dayNo - b.dayNo;
        return a.orderNo - b.orderNo;
      });
    }

    return { trainingPlan: fullPlan };
  }

  @Post('/:id/enroll')
  @UseBefore(authMiddleware)
  async enrollToTrainingPlan(
    @Req() request: RequestWithUser,
    @Param('id') id: number,
    @Body({ type: EnrollTrainingPlanDto }) body: EnrollTrainingPlanDto,
  ) {
    const userTrainingPlanRepository = this.repository.manager.getRepository(UserTrainingPlan);

    const trainingPlan = await this.repository.findOneBy({ id });
    if (!trainingPlan) {
      throw new NotFoundError('Training plan not found');
    }

    const existing = await userTrainingPlanRepository.findOneBy({
      userId: request.user.id,
      planId: id,
      status: 'active',
    });

    if (existing) {
      throw new BadRequestError('User is already enrolled in this training plan');
    }

    const userTrainingPlan = userTrainingPlanRepository.create({
      userId: request.user.id,
      planId: id,
      status: 'active',
      startDate: body.startDate,
      progressPercent: 0,
    });

    const savedUserTrainingPlan = await userTrainingPlanRepository.save(userTrainingPlan);

    const fullUserTrainingPlan = await userTrainingPlanRepository.findOne({
      where: { id: savedUserTrainingPlan.id },
      relations: ['trainingPlan', 'trainingPlan.difficultyLevel'],
    });

    return { userTrainingPlan: fullUserTrainingPlan };
  }

  @Get('/me/list')
  @UseBefore(authMiddleware)
  async getMyTrainingPlansShortcut(@Req() request: RequestWithUser) {
    const userTrainingPlanRepository = this.repository.manager.getRepository(UserTrainingPlan);

    const items = await userTrainingPlanRepository.find({
      where: { userId: request.user.id },
      relations: ['trainingPlan', 'trainingPlan.difficultyLevel'],
      order: {
        createdAt: 'DESC',
      },
    });

    return { items };
  }
}

export default TrainingPlanController;