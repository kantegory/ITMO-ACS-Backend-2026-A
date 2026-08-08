import {
  Body,
  Delete,
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
  IsDateString,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

import EntityController from '../common/entity-controller';
import BaseController from '../common/base-controller';

import { BodyMetric } from '../models/body-metric.entity';

import authMiddleware, { RequestWithUser } from '../middlewares/auth.middleware';

class CreateBodyMetricDto {
  @IsDateString()
  @Type(() => String)
  measuredAt!: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  weightKg?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  chestCm?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  waistCm?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  hipsCm?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  @Type(() => Number)
  bodyFatPercent?: number;

  @IsOptional()
  @IsString()
  @Type(() => String)
  comment?: string;
}

class UpdateBodyMetricDto {
  @IsOptional()
  @IsDateString()
  @Type(() => String)
  measuredAt?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  weightKg?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  chestCm?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  waistCm?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  hipsCm?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  @Type(() => Number)
  bodyFatPercent?: number;

  @IsOptional()
  @IsString()
  @Type(() => String)
  comment?: string;
}

@EntityController({
  baseRoute: '/users/me/body-metrics',
  entity: BodyMetric,
})
class BodyMetricController extends BaseController {
  @Get('/')
  @UseBefore(authMiddleware)
  async getMyBodyMetrics(
    @Req() request: RequestWithUser,
    @QueryParam('dateFrom') dateFrom?: string,
    @QueryParam('dateTo') dateTo?: string,
    @QueryParam('page') page?: string,
    @QueryParam('pageSize') pageSize?: string,
  ) {
    const qb = this.repository
      .createQueryBuilder('bodyMetric')
      .where('bodyMetric.userId = :userId', { userId: request.user.id });

    if (dateFrom) {
      qb.andWhere('bodyMetric.measuredAt >= :dateFrom', { dateFrom });
    }

    if (dateTo) {
      qb.andWhere('bodyMetric.measuredAt <= :dateTo', { dateTo });
    }

    qb.orderBy('bodyMetric.measuredAt', 'DESC');

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
  async createBodyMetric(
    @Req() request: RequestWithUser,
    @Body({ type: CreateBodyMetricDto }) body: CreateBodyMetricDto,
  ) {
    const bodyMetric = this.repository.create({
      userId: request.user.id,
      measuredAt: body.measuredAt,
      weightKg: body.weightKg as any,
      chestCm: body.chestCm as any,
      waistCm: body.waistCm as any,
      hipsCm: body.hipsCm as any,
      bodyFatPercent: body.bodyFatPercent as any,
      comment: body.comment,
    });

    const savedBodyMetric = await this.repository.save(bodyMetric);

    return { bodyMetric: savedBodyMetric };
  }

  @Patch('/:id')
  @UseBefore(authMiddleware)
  async updateBodyMetric(
    @Req() request: RequestWithUser,
    @Param('id') id: number,
    @Body({ type: UpdateBodyMetricDto }) body: UpdateBodyMetricDto,
  ) {
    const bodyMetric = await this.repository.findOneBy({
      id,
      userId: request.user.id,
    });

    if (!bodyMetric) {
      throw new NotFoundError('Body metric not found');
    }

    Object.assign(bodyMetric, {
      ...body,
      weightKg: body.weightKg !== undefined ? (body.weightKg as any) : bodyMetric.weightKg,
      chestCm: body.chestCm !== undefined ? (body.chestCm as any) : bodyMetric.chestCm,
      waistCm: body.waistCm !== undefined ? (body.waistCm as any) : bodyMetric.waistCm,
      hipsCm: body.hipsCm !== undefined ? (body.hipsCm as any) : bodyMetric.hipsCm,
      bodyFatPercent:
        body.bodyFatPercent !== undefined ? (body.bodyFatPercent as any) : bodyMetric.bodyFatPercent,
    });

    const updatedBodyMetric = await this.repository.save(bodyMetric);

    return { bodyMetric: updatedBodyMetric };
  }

  @Delete('/:id')
  @UseBefore(authMiddleware)
  async deleteBodyMetric(
    @Req() request: RequestWithUser,
    @Param('id') id: number,
  ) {
    const bodyMetric = await this.repository.findOneBy({
      id,
      userId: request.user.id,
    });

    if (!bodyMetric) {
      throw new NotFoundError('Body metric not found');
    }

    await this.repository.remove(bodyMetric);

    return { success: true };
  }
}

export default BodyMetricController;