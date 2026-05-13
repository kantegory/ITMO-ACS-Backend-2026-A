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
import {
  IsDateString,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

import EntityController from '../common/entity-controller';
import BaseController from '../common/base-controller';

import { WorkoutSession } from '../models/workout-session.entity';
import { Workout } from '../models/workout.entity';
import { UserTrainingPlan } from '../models/user-training-plan.entity';

import authMiddleware, { RequestWithUser } from '../middlewares/auth.middleware';

class CreateWorkoutSessionDto {
  @IsInt()
  @Min(1)
  @Type(() => Number)
  workoutId!: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  userTrainingPlanId?: number;

  @IsDateString()
  @Type(() => String)
  startedAt!: string;

  @IsOptional()
  @IsDateString()
  @Type(() => String)
  completedAt?: string;

  @IsInt()
  @Min(1)
  @Type(() => Number)
  durationFactMin!: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Type(() => Number)
  caloriesFact?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  @Type(() => Number)
  rating?: number;

  @IsOptional()
  @IsString()
  @Type(() => String)
  notes?: string;
}

@EntityController({
  baseRoute: '/users/me/workout-sessions',
  entity: WorkoutSession,
})
class WorkoutSessionController extends BaseController {
  @Get('/')
  @UseBefore(authMiddleware)
  async getMyWorkoutSessions(
    @Req() request: RequestWithUser,
    @QueryParam('workoutId') workoutId?: string,
    @QueryParam('dateFrom') dateFrom?: string,
    @QueryParam('dateTo') dateTo?: string,
    @QueryParam('page') page?: string,
    @QueryParam('pageSize') pageSize?: string,
  ) {
    const qb = this.repository
      .createQueryBuilder('workoutSession')
      .leftJoinAndSelect('workoutSession.workout', 'workout')
      .leftJoinAndSelect('workout.difficultyLevel', 'difficultyLevel')
      .leftJoinAndSelect('workout.types', 'types')
      .where('workoutSession.userId = :userId', { userId: request.user.id });

    if (workoutId) {
      qb.andWhere('workoutSession.workoutId = :workoutId', {
        workoutId: Number(workoutId),
      });
    }

    if (dateFrom) {
      qb.andWhere('workoutSession.startedAt >= :dateFrom', { dateFrom });
    }

    if (dateTo) {
      qb.andWhere('workoutSession.startedAt <= :dateTo', { dateTo });
    }

    qb.orderBy('workoutSession.startedAt', 'DESC');

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

  @Post('/')
  @UseBefore(authMiddleware)
  async createWorkoutSession(
    @Req() request: RequestWithUser,
    @Body({ type: CreateWorkoutSessionDto }) body: CreateWorkoutSessionDto,
  ) {
    const workoutRepository = this.repository.manager.getRepository(Workout);
    const userTrainingPlanRepository = this.repository.manager.getRepository(UserTrainingPlan);

    const workout = await workoutRepository.findOneBy({ id: body.workoutId });
    if (!workout) {
      throw new BadRequestError('Workout not found');
    }

    if (body.userTrainingPlanId) {
      const userTrainingPlan = await userTrainingPlanRepository.findOneBy({
        id: body.userTrainingPlanId,
        userId: request.user.id,
      });

      if (!userTrainingPlan) {
        throw new BadRequestError('User training plan not found');
      }
    }

    if (body.completedAt) {
      const startedAt = new Date(body.startedAt);
      const completedAt = new Date(body.completedAt);

      if (completedAt < startedAt) {
        throw new BadRequestError('completedAt cannot be earlier than startedAt');
      }
    }

    const workoutSession = this.repository.create({
      userId: request.user.id,
      workoutId: body.workoutId,
      userTrainingPlanId: body.userTrainingPlanId,
      startedAt: new Date(body.startedAt),
      completedAt: body.completedAt ? new Date(body.completedAt) : undefined,
      durationFactMin: body.durationFactMin,
      caloriesFact: body.caloriesFact,
      rating: body.rating,
      notes: body.notes,
    });

    const savedWorkoutSession = await this.repository.save(workoutSession);

    const fullWorkoutSession = await this.repository.findOne({
      where: { id: savedWorkoutSession.id },
      relations: ['workout', 'workout.difficultyLevel', 'workout.types'],
    });

    return { workoutSession: fullWorkoutSession };
  }

  @Get('/:id')
  @UseBefore(authMiddleware)
  async getWorkoutSessionById(
    @Req() request: RequestWithUser,
    @Param('id') id: number,
  ) {
    const workoutSession = await this.repository.findOne({
      where: { id, userId: request.user.id },
      relations: ['workout', 'workout.difficultyLevel', 'workout.types'],
    });

    if (!workoutSession) {
      throw new NotFoundError('Workout session not found');
    }

    return { workoutSession };
  }
}

export default WorkoutSessionController;