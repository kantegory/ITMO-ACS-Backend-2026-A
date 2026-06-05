import { Post, Body, Req, Res, UseBefore, HttpCode } from "routing-controllers";
import { OpenAPI } from "routing-controllers-openapi";
import { IsInt, IsString, IsOptional, Min, Max } from "class-validator";
import { Type } from "class-transformer";
import { Response } from "express";

import EntityController from "../common/entity-controller";
import BaseController from "../common/base-controller";
import authMiddleware, {
  RequestWithUser,
} from "../middlewares/auth.middleware";
import dataSource from "../config/data-source";

import { LandlordReview } from "../models/landlord-review.entity";
import { Rental } from "../models/rental.entity";
import { User } from "../models/user.entity";
import { RentalStatus } from "../models/enums";

class CreateReviewDto {
  @IsInt()
  @Type(() => Number)
  rental_id: number;

  @IsInt()
  @Min(1)
  @Max(5)
  @Type(() => Number)
  rating: number;

  @IsString()
  @IsOptional()
  comment?: string;
}

@EntityController({ baseRoute: "/reviews", entity: LandlordReview })
class ReviewController extends BaseController {
  @Post("")
  @HttpCode(201)
  @UseBefore(authMiddleware)
  @OpenAPI({
    summary: "Оставить отзыв об арендодателе",
    security: [{ bearerAuth: [] }],
  })
  async create(
    @Req() req: RequestWithUser,
    @Body({ type: CreateReviewDto }) dto: CreateReviewDto,
    @Res() res: Response,
  ) {
    const rentalRepo = dataSource.getRepository(Rental);
    const rental = await rentalRepo.findOne({
      where: { id: dto.rental_id },
      relations: ["property"],
    });

    if (!rental)
      return res
        .status(404)
        .json({ code: "NOT_FOUND", message: "Аренда не найдена" });
    if (rental.renterId !== req.user.id) {
      return res
        .status(403)
        .json({ code: "FORBIDDEN", message: "Нет доступа" });
    }
    if (rental.status !== RentalStatus.COMPLETED) {
      return res
        .status(422)
        .json({ code: "RENTAL_NOT_COMPLETED", message: "Аренда не завершена" });
    }

    const reviewRepo = dataSource.getRepository(LandlordReview);
    const existing = await reviewRepo.findOneBy({
      rentalId: dto.rental_id,
      reviewerId: req.user.id,
    });
    if (existing) {
      return res
        .status(409)
        .json({
          code: "REVIEW_ALREADY_EXISTS",
          message: "Отзыв уже существует",
        });
    }

    const landlordId = rental.property.ownerId;
    const review = reviewRepo.create({
      landlordId,
      reviewerId: req.user.id,
      rentalId: dto.rental_id,
      rating: dto.rating,
      comment: dto.comment ?? null,
    });
    await reviewRepo.save(review);

    const reviewer = await dataSource
      .getRepository(User)
      .findOneBy({ id: req.user.id });

    return res.status(201).json({
      id: review.id,
      reviewer: {
        id: reviewer.id,
        first_name: reviewer.firstName,
        last_name: reviewer.lastName,
        email: reviewer.email,
        avatar_url: reviewer.avatarUrl ?? null,
        roles: [],
      },
      rating: review.rating,
      comment: review.comment ?? null,
      created_at: review.createdAt,
    });
  }
}

export default ReviewController;
