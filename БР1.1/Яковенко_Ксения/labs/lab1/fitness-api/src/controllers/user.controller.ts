import {
  Body,
  Get,
  Patch,
  Req,
  UseBefore,
  NotFoundError,
  BadRequestError,
  QueryParam,
  Param,
} from 'routing-controllers';
import { Type } from 'class-transformer';
import { IsOptional, IsString, IsInt, Min, Max } from 'class-validator';
import { Repository } from 'typeorm';

import EntityController from '../common/entity-controller';
import BaseController from '../common/base-controller';
import { User } from '../models/user.entity';
import { UserProfile } from '../models/user-profile.entity';
import { UserTrainingPlan } from '../models/user-training-plan.entity';
import authMiddleware, { RequestWithUser } from '../middlewares/auth.middleware';

class UpdateProfileDto {
  @IsOptional()
  @IsString()
  @Type(() => String)
  firstName?: string;

  @IsOptional()
  @IsString()
  @Type(() => String)
  lastName?: string;

  @IsOptional()
  @IsString()
  @Type(() => String)
  birthDate?: string;

  @IsOptional()
  @IsInt()
  @Min(50)
  @Max(300)
  @Type(() => Number)
  heightCm?: number;

  @IsOptional()
  @IsString()
  @Type(() => String)
  fitnessGoal?: string;

  @IsOptional()
  @IsString()
  @Type(() => String)
  avatarUrl?: string;

  @IsOptional()
  @IsString()
  @Type(() => String)
  about?: string;
}



@EntityController({
  baseRoute: '/users',
  entity: User,
})
class UserController extends BaseController {
  @Get('/me')
  @UseBefore(authMiddleware)
  async me(@Req() request: RequestWithUser) {
    const userRepository = this.repository as Repository<User>;
    const profileRepository = this.repository.manager.getRepository(UserProfile);

    const foundUser = await userRepository.findOneBy({ id: request.user.id });

    if (!foundUser) {
      throw new NotFoundError('User not found');
    }

    const profile = await profileRepository.findOneBy({ userId: request.user.id });

    return {
      user: foundUser,
      profile,
    };
  }

  @Patch('/me/profile')
  @UseBefore(authMiddleware)
  async updateProfile(
    @Req() request: RequestWithUser,
    @Body({ type: UpdateProfileDto }) body: UpdateProfileDto,
  ) {
    const profileRepository = this.repository.manager.getRepository(UserProfile);

    const profile = await profileRepository.findOneBy({ userId: request.user.id });

    if (!profile) {
      throw new NotFoundError('Profile not found');
    }

    Object.assign(profile, body);

    const updatedProfile = await profileRepository.save(profile);

    return {
      profile: updatedProfile,
    };
  }

    @Get('/me/training-plans')
  @UseBefore(authMiddleware)
  async getMyTrainingPlans(
    @Req() request: RequestWithUser,
    @QueryParam('status') status?: string,
    @QueryParam('page') page?: string,
    @QueryParam('pageSize') pageSize?: string,
  ) {
    const userTrainingPlanRepository = this.repository.manager.getRepository(UserTrainingPlan);

    const qb = userTrainingPlanRepository
      .createQueryBuilder('userTrainingPlan')
      .leftJoinAndSelect('userTrainingPlan.trainingPlan', 'trainingPlan')
      .leftJoinAndSelect('trainingPlan.difficultyLevel', 'difficultyLevel')
      .where('userTrainingPlan.userId = :userId', { userId: request.user.id });

    if (status) {
      qb.andWhere('userTrainingPlan.status = :status', { status });
    }

    qb.orderBy('userTrainingPlan.createdAt', 'DESC');

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

  @Patch('/me/training-plans/:userPlanId')
  @UseBefore(authMiddleware)
  async updateMyTrainingPlan(
    @Req() request: RequestWithUser,
    @Param('userPlanId') userPlanId: number,
    @Body() body: {
      status?: 'active' | 'completed' | 'cancelled';
      endDate?: string;
      progressPercent?: number;
    },
  ) {
    const userTrainingPlanRepository = this.repository.manager.getRepository(UserTrainingPlan);

    const userTrainingPlan = await userTrainingPlanRepository.findOneBy({
      id: userPlanId,
      userId: request.user.id,
    });

    if (!userTrainingPlan) {
      throw new NotFoundError('User training plan not found');
    }

    if (body.progressPercent !== undefined) {
      if (body.progressPercent < 0 || body.progressPercent > 100) {
        throw new BadRequestError('progressPercent must be between 0 and 100');
      }
      userTrainingPlan.progressPercent = body.progressPercent;
    }

    if (body.status !== undefined) {
      userTrainingPlan.status = body.status;
    }

    if (body.endDate !== undefined) {
      userTrainingPlan.endDate = body.endDate;
    }

    if (userTrainingPlan.endDate && userTrainingPlan.startDate) {
      const start = new Date(userTrainingPlan.startDate);
      const end = new Date(userTrainingPlan.endDate);

      if (end < start) {
        throw new BadRequestError('endDate cannot be earlier than startDate');
      }
    }

    const updatedUserTrainingPlan = await userTrainingPlanRepository.save(userTrainingPlan);

    return { userTrainingPlan: updatedUserTrainingPlan };
  }
}

export default UserController;