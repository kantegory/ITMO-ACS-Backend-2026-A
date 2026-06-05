import {
  Get,
  Post,
  Patch,
  Body,
  Param,
  QueryParam,
  Req,
  Res,
  UseBefore,
  HttpCode,
} from "routing-controllers";
import { OpenAPI } from "routing-controllers-openapi";
import {
  IsInt,
  IsNumber,
  IsString,
  IsOptional,
  IsEnum,
  IsDateString,
} from "class-validator";
import { Type } from "class-transformer";
import { Response } from "express";

import EntityController from "../common/entity-controller";
import BaseController from "../common/base-controller";
import authMiddleware, {
  RequestWithUser,
} from "../middlewares/auth.middleware";
import dataSource from "../config/data-source";

import { Rental } from "../models/rental.entity";
import { Property } from "../models/property.entity";
import { PropertyPhoto } from "../models/property-photo.entity";
import { RentalStatus, PropertyStatus } from "../models/enums";

class CreateRentalDto {
  @IsInt()
  @Type(() => Number)
  property_id: number;

  @IsNumber()
  @Type(() => Number)
  agreed_price: number;

  @IsDateString()
  start_date: string;

  @IsDateString()
  @IsOptional()
  end_date?: string;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  deposit_amount?: number;
}

class UpdateRentalStatusDto {
  @IsEnum(RentalStatus)
  status: RentalStatus;

  @IsString()
  @IsOptional()
  cancel_reason?: string;
}

const VALID_TRANSITIONS: Record<RentalStatus, RentalStatus[]> = {
  [RentalStatus.PENDING]: [RentalStatus.ACTIVE, RentalStatus.CANCELLED],
  [RentalStatus.ACTIVE]: [RentalStatus.COMPLETED, RentalStatus.CANCELLED],
  [RentalStatus.COMPLETED]: [],
  [RentalStatus.CANCELLED]: [],
};

@EntityController({ baseRoute: "/rentals", entity: Rental })
class RentalController extends BaseController {
  @Get("")
  @UseBefore(authMiddleware)
  @OpenAPI({
    summary: "Список аренд текущего пользователя",
    security: [{ bearerAuth: [] }],
  })
  async list(
    @Req() req: RequestWithUser,
    @QueryParam("status") status: RentalStatus,
    @QueryParam("role") role: "renter" | "landlord",
    @QueryParam("page") page: number = 1,
    @QueryParam("page_size") pageSize: number = 20,
    @Res() res: Response,
  ) {
    const repo = dataSource.getRepository(Rental);
    const qb = repo
      .createQueryBuilder("r")
      .leftJoinAndSelect("r.property", "p");

    if (role === "landlord") {
      qb.where("p.ownerId = :uid", { uid: req.user.id });
    } else {
      qb.where("r.renterId = :uid", { uid: req.user.id });
    }

    if (status) qb.andWhere("r.status = :status", { status });

    qb.orderBy("r.createdAt", "DESC")
      .skip((page - 1) * pageSize)
      .take(pageSize);

    const [items, total] = await qb.getManyAndCount();

    const propertyIds = items.map((r) => r.propertyId);
    const photoMap: Record<number, string | null> = {};
    if (propertyIds.length) {
      const photos = await dataSource.getRepository(PropertyPhoto).find({
        where: propertyIds.map((id) => ({ propertyId: id, isMain: true })),
      });
      photos.forEach((ph) => {
        photoMap[ph.propertyId] = ph.url;
      });
    }

    return res.json({
      items: items.map((r) => ({
        id: r.id,
        property_title: r.property?.title,
        property_main_photo: photoMap[r.propertyId] ?? null,
        city: r.property?.city,
        agreed_price: r.agreedPrice,
        currency: r.currency,
        start_date: r.startDate,
        end_date: r.endDate ?? null,
        status: r.status,
      })),
      total,
    });
  }

  @Post("")
  @HttpCode(201)
  @UseBefore(authMiddleware)
  @OpenAPI({
    summary: "Создать заявку на аренду",
    security: [{ bearerAuth: [] }],
  })
  async create(
    @Req() req: RequestWithUser,
    @Body({ type: CreateRentalDto }) dto: CreateRentalDto,
    @Res() res: Response,
  ) {
    const propertyRepo = dataSource.getRepository(Property);
    const property = await propertyRepo.findOneBy({ id: dto.property_id });
    if (!property)
      return res
        .status(404)
        .json({ code: "NOT_FOUND", message: "Объект не найден" });
    if (property.ownerId === req.user.id) {
      return res
        .status(400)
        .json({
          code: "CANNOT_RENT_OWN_PROPERTY",
          message: "Нельзя арендовать свой объект",
        });
    }
    if (property.status === PropertyStatus.RENTED) {
      return res
        .status(409)
        .json({
          code: "PROPERTY_ALREADY_RENTED",
          message: "Объект уже арендован",
        });
    }
    if (property.status === PropertyStatus.ARCHIVED) {
      return res
        .status(409)
        .json({
          code: "PROPERTY_NOT_AVAILABLE",
          message: "Объект недоступен для аренды",
        });
    }

    const repo = dataSource.getRepository(Rental);
    const rental = repo.create({
      propertyId: dto.property_id,
      renterId: req.user.id,
      agreedPrice: dto.agreed_price,
      currency: property.currency,
      depositAmount: dto.deposit_amount ?? null,
      startDate: dto.start_date,
      endDate: dto.end_date ?? null,
      status: RentalStatus.PENDING,
    });
    await repo.save(rental);

    return res.status(201).json(await this._buildDetail(rental.id));
  }

  @Get("/:id")
  @UseBefore(authMiddleware)
  @OpenAPI({ summary: "Детали аренды", security: [{ bearerAuth: [] }] })
  async getById(
    @Param("id") id: number,
    @Req() req: RequestWithUser,
    @Res() res: Response,
  ) {
    const rental = await dataSource.getRepository(Rental).findOne({
      where: { id },
      relations: ["property", "renter", "transactions"],
    });
    if (!rental)
      return res
        .status(404)
        .json({ code: "NOT_FOUND", message: "Аренда не найдена" });

    const ownerId = rental.property?.ownerId;
    if (rental.renterId !== req.user.id && ownerId !== req.user.id) {
      return res
        .status(403)
        .json({ code: "FORBIDDEN", message: "Нет доступа" });
    }

    return res.json(await this._buildDetail(id));
  }

  @Patch("/:id/status")
  @UseBefore(authMiddleware)
  @OpenAPI({
    summary: "Изменить статус аренды",
    security: [{ bearerAuth: [] }],
  })
  async updateStatus(
    @Param("id") id: number,
    @Req() req: RequestWithUser,
    @Body({ type: UpdateRentalStatusDto }) dto: UpdateRentalStatusDto,
    @Res() res: Response,
  ) {
    const repo = dataSource.getRepository(Rental);
    const rental = await repo.findOne({
      where: { id },
      relations: ["property"],
    });
    if (!rental)
      return res
        .status(404)
        .json({ code: "NOT_FOUND", message: "Аренда не найдена" });

    const ownerId = rental.property?.ownerId;
    if (rental.renterId !== req.user.id && ownerId !== req.user.id) {
      return res
        .status(403)
        .json({ code: "FORBIDDEN", message: "Нет доступа" });
    }

    const allowed = VALID_TRANSITIONS[rental.status];
    if (!allowed.includes(dto.status)) {
      return res
        .status(422)
        .json({
          code: "INVALID_STATUS_TRANSITION",
          message: "Недопустимый переход статуса",
        });
    }

    rental.status = dto.status;
    if (dto.cancel_reason) rental.cancelReason = dto.cancel_reason;
    if (dto.status === RentalStatus.CANCELLED) rental.cancelledAt = new Date();

    const propertyRepo = dataSource.getRepository(Property);
    if (dto.status === RentalStatus.ACTIVE) {
      await propertyRepo.update(rental.propertyId, {
        status: PropertyStatus.RENTED,
      });
    }
    if (
      dto.status === RentalStatus.COMPLETED ||
      dto.status === RentalStatus.CANCELLED
    ) {
      await propertyRepo.update(rental.propertyId, {
        status: PropertyStatus.ACTIVE,
      });
    }

    await repo.save(rental);
    return res.json(await this._buildDetail(id));
  }

  private async _buildDetail(rentalId: number) {
    const rental = await dataSource.getRepository(Rental).findOne({
      where: { id: rentalId },
      relations: ["property", "renter", "transactions"],
    });
    if (!rental) return null;

    return {
      id: rental.id,
      property: rental.property
        ? {
            id: rental.property.id,
            title: rental.property.title,
            type: rental.property.type,
            city: rental.property.city,
            price_per_month: rental.property.pricePerMonth,
            currency: rental.property.currency,
            rooms: rental.property.rooms ?? null,
            area_sqm: rental.property.areaSqm ?? null,
            main_photo_url: null,
            status: rental.property.status,
            is_favorited: false,
          }
        : null,
      renter: rental.renter
        ? {
            id: rental.renter.id,
            first_name: rental.renter.firstName,
            last_name: rental.renter.lastName,
            email: rental.renter.email,
            avatar_url: rental.renter.avatarUrl ?? null,
            roles: [],
          }
        : null,
      agreed_price: rental.agreedPrice,
      currency: rental.currency,
      deposit_amount: rental.depositAmount ?? null,
      deposit_status: rental.depositStatus ?? null,
      start_date: rental.startDate,
      end_date: rental.endDate ?? null,
      status: rental.status,
      transactions: (rental.transactions ?? []).map((t) => ({
        id: t.id,
        type: t.type,
        amount: t.amount,
        currency: t.currency,
        status: t.status,
        payment_method: t.paymentMethod,
        payment_date: t.paymentDate ?? null,
        period_start: t.periodStart ?? null,
        period_end: t.periodEnd ?? null,
        created_at: t.createdAt,
      })),
      cancel_reason: rental.cancelReason ?? null,
      created_at: rental.createdAt,
    };
  }
}

export default RentalController;
