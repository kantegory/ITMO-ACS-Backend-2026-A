import {
  Get,
  Post,
  Patch,
  Delete,
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
  IsString,
  IsOptional,
  IsEnum,
  IsNumber,
  IsInt,
  IsBoolean,
} from "class-validator";
import { Type } from "class-transformer";
import { Response } from "express";
import jwt from "jsonwebtoken";

import SETTINGS from "../config/settings";
import EntityController from "../common/entity-controller";
import BaseController from "../common/base-controller";
import authMiddleware, {
  RequestWithUser,
} from "../middlewares/auth.middleware";
import dataSource from "../config/data-source";

import { Property } from "../models/property.entity";
import { PropertyPhoto } from "../models/property-photo.entity";
import { PropertyPriceHistory } from "../models/property-price-history.entity";
import { Favorite } from "../models/favorite.entity";
import { LandlordReview } from "../models/landlord-review.entity";
import { UserRoleEntity } from "../models/user-role.entity";
import {
  PropertyType,
  PropertyStatus,
  CurrencyType,
  UserRole,
} from "../models/enums";

class CreatePropertyDto {
  @IsEnum(PropertyType)
  type: PropertyType;

  @IsString()
  title: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  street: string;

  @IsString()
  building: string;

  @IsString()
  @IsOptional()
  apartment?: string;

  @IsString()
  @IsOptional()
  postal_code?: string;

  @IsString()
  city: string;

  @IsString()
  country: string;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  latitude?: number;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  longitude?: number;

  @IsInt()
  @IsOptional()
  @Type(() => Number)
  rooms?: number;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  area_sqm?: number;

  @IsInt()
  @IsOptional()
  @Type(() => Number)
  floor?: number;

  @IsNumber()
  @Type(() => Number)
  price_per_month: number;

  @IsEnum(CurrencyType)
  @IsOptional()
  currency?: CurrencyType;

  @IsString()
  @IsOptional()
  rental_conditions?: string;
}

class UpdatePropertyDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  price_per_month?: number;

  @IsString()
  @IsOptional()
  rental_conditions?: string;

  @IsEnum(PropertyStatus)
  @IsOptional()
  status?: PropertyStatus;

  @IsInt()
  @IsOptional()
  @Type(() => Number)
  rooms?: number;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  area_sqm?: number;

  @IsInt()
  @IsOptional()
  @Type(() => Number)
  floor?: number;
}

class AddPhotoDto {
  @IsString()
  url: string;

  @IsBoolean()
  @IsOptional()
  @Type(() => Boolean)
  is_main?: boolean;

  @IsInt()
  @IsOptional()
  @Type(() => Number)
  sort_order?: number;
}

const VALID_STATUS_TRANSITIONS: Record<PropertyStatus, PropertyStatus[]> = {
  [PropertyStatus.ACTIVE]: [PropertyStatus.ARCHIVED],
  [PropertyStatus.RENTED]: [PropertyStatus.ARCHIVED],
  [PropertyStatus.ARCHIVED]: [PropertyStatus.ACTIVE],
};

function tryGetUserIdFromAuth(authHeader?: string): number | null {
  if (!authHeader) return null;
  try {
    const [, token] = authHeader.split(" ");
    const payload: any = jwt.verify(token, SETTINGS.JWT_SECRET_KEY);
    return payload?.user?.id ?? null;
  } catch {
    return null;
  }
}

@EntityController({ baseRoute: "/properties", entity: Property })
class PropertyController extends BaseController {
  @Get("")
  @OpenAPI({ summary: "Поиск недвижимости с фильтрацией" })
  async search(
    @QueryParam("city") city: string,
    @QueryParam("type") type: PropertyType,
    @QueryParam("price_min") priceMin: number,
    @QueryParam("price_max") priceMax: number,
    @QueryParam("rooms_min") roomsMin: number,
    @QueryParam("rooms_max") roomsMax: number,
    @QueryParam("status") status: PropertyStatus,
    @QueryParam("page") page: number = 1,
    @QueryParam("page_size") pageSize: number = 20,
    @QueryParam("sort_by") sortBy: string = "created_at",
    @Req() req: any,
    @Res() res: Response,
  ) {
    const repo = dataSource.getRepository(Property);
    const qb = repo
      .createQueryBuilder("p")
      .leftJoinAndSelect("p.photos", "photo", "photo.isMain = true")
      .where("p.deletedAt IS NULL");

    if (city) qb.andWhere("p.city ILIKE :city", { city: `%${city}%` });
    if (type) qb.andWhere("p.type = :type", { type });
    if (status) qb.andWhere("p.status = :status", { status });
    else qb.andWhere("p.status = :status", { status: PropertyStatus.ACTIVE });
    if (priceMin) qb.andWhere("p.pricePerMonth >= :priceMin", { priceMin });
    if (priceMax) qb.andWhere("p.pricePerMonth <= :priceMax", { priceMax });
    if (roomsMin) qb.andWhere("p.rooms >= :roomsMin", { roomsMin });
    if (roomsMax) qb.andWhere("p.rooms <= :roomsMax", { roomsMax });

    const sortMap: Record<string, [string, "ASC" | "DESC"]> = {
      created_at: ["p.createdAt", "DESC"],
      price_asc: ["p.pricePerMonth", "ASC"],
      price_desc: ["p.pricePerMonth", "DESC"],
    };
    const [sortField, sortOrder] = sortMap[sortBy] ?? sortMap.created_at;
    qb.orderBy(sortField, sortOrder);

    const skip = (page - 1) * pageSize;
    qb.skip(skip).take(pageSize);

    const [items, total] = await qb.getManyAndCount();

    let favSet = new Set<number>();
    const userId = tryGetUserIdFromAuth(req.headers?.authorization);
    if (userId) {
      const favs = await dataSource.getRepository(Favorite).findBy({ userId });
      favSet = new Set(favs.map((f) => f.propertyId));
    }

    return res.json({
      items: items.map((p) => ({
        id: p.id,
        title: p.title,
        type: p.type,
        city: p.city,
        price_per_month: p.pricePerMonth,
        currency: p.currency,
        rooms: p.rooms ?? null,
        area_sqm: p.areaSqm ?? null,
        main_photo_url: p.photos?.[0]?.url ?? null,
        status: p.status,
        is_favorited: favSet.has(p.id),
      })),
      total,
      page,
      page_size: pageSize,
      total_pages: Math.ceil(total / pageSize),
    });
  }

  @Post("")
  @HttpCode(201)
  @UseBefore(authMiddleware)
  @OpenAPI({
    summary: "Создать объект недвижимости",
    security: [{ bearerAuth: [] }],
  })
  async create(
    @Req() req: RequestWithUser,
    @Body({ type: CreatePropertyDto }) dto: CreatePropertyDto,
    @Res() res: Response,
  ) {
    const roles = await dataSource
      .getRepository(UserRoleEntity)
      .findBy({ userId: req.user.id });
    const isLandlord = roles.some((r) => r.role === UserRole.LANDLORD);
    if (!isLandlord) {
      return res
        .status(403)
        .json({ code: "ROLE_REQUIRED", message: "Требуется роль landlord" });
    }

    const repo = dataSource.getRepository(Property);
    const property = repo.create({
      type: dto.type,
      title: dto.title,
      description: dto.description ?? null,
      street: dto.street,
      building: dto.building,
      apartment: dto.apartment ?? null,
      postalCode: dto.postal_code ?? null,
      city: dto.city,
      country: dto.country,
      latitude: dto.latitude ?? null,
      longitude: dto.longitude ?? null,
      rooms: dto.rooms ?? null,
      areaSqm: dto.area_sqm ?? null,
      floor: dto.floor ?? null,
      pricePerMonth: dto.price_per_month,
      currency: dto.currency ?? CurrencyType.RUB,
      rentalConditions: dto.rental_conditions ?? null,
      ownerId: req.user.id,
      status: PropertyStatus.ACTIVE,
    });
    await repo.save(property);

    const histRepo = dataSource.getRepository(PropertyPriceHistory);
    await histRepo.save(
      histRepo.create({
        propertyId: property.id,
        pricePerMonth: property.pricePerMonth,
        currency: property.currency,
      }),
    );

    return res
      .status(201)
      .json(await this._buildDetail(property.id, req.user.id));
  }

  @Get("/:id")
  @OpenAPI({ summary: "Получить детали объекта" })
  async getById(
    @Param("id") id: number,
    @Req() req: any,
    @Res() res: Response,
  ) {
    const userId = tryGetUserIdFromAuth(req.headers?.authorization);
    const detail = await this._buildDetail(id, userId ?? undefined);
    if (!detail)
      return res
        .status(404)
        .json({ code: "NOT_FOUND", message: "Объект не найден" });
    return res.json(detail);
  }

  @Patch("/:id")
  @UseBefore(authMiddleware)
  @OpenAPI({ summary: "Обновить объект", security: [{ bearerAuth: [] }] })
  async update(
    @Param("id") id: number,
    @Req() req: RequestWithUser,
    @Body({ type: UpdatePropertyDto }) dto: UpdatePropertyDto,
    @Res() res: Response,
  ) {
    const repo = dataSource.getRepository(Property);
    const property = await repo.findOneBy({ id });
    if (!property)
      return res
        .status(404)
        .json({ code: "NOT_FOUND", message: "Объект не найден" });
    if (property.ownerId !== req.user.id) {
      return res
        .status(403)
        .json({ code: "FORBIDDEN", message: "Нет доступа" });
    }

    if (dto.status && dto.status !== property.status) {
      const allowed = VALID_STATUS_TRANSITIONS[property.status] ?? [];
      if (!allowed.includes(dto.status)) {
        return res.status(422).json({
          code: "INVALID_STATUS_TRANSITION",
          message: `Недопустимый переход статуса ${property.status} → ${dto.status}`,
        });
      }
    }

    const oldPrice = property.pricePerMonth;
    if (dto.title !== undefined) property.title = dto.title;
    if (dto.description !== undefined) property.description = dto.description;
    if (dto.price_per_month !== undefined)
      property.pricePerMonth = dto.price_per_month;
    if (dto.rental_conditions !== undefined)
      property.rentalConditions = dto.rental_conditions;
    if (dto.status !== undefined) property.status = dto.status;
    if (dto.rooms !== undefined) property.rooms = dto.rooms;
    if (dto.area_sqm !== undefined) property.areaSqm = dto.area_sqm;
    if (dto.floor !== undefined) property.floor = dto.floor;
    await repo.save(property);

    if (
      dto.price_per_month !== undefined &&
      Number(dto.price_per_month) !== Number(oldPrice)
    ) {
      const histRepo = dataSource.getRepository(PropertyPriceHistory);
      await histRepo.save(
        histRepo.create({
          propertyId: property.id,
          pricePerMonth: property.pricePerMonth,
          currency: property.currency,
        }),
      );
    }

    return res.json(await this._buildDetail(property.id, req.user.id));
  }

  @Delete("/:id")
  @UseBefore(authMiddleware)
  @OpenAPI({
    summary: "Удалить объект (soft delete)",
    security: [{ bearerAuth: [] }],
  })
  async remove(
    @Param("id") id: number,
    @Req() req: RequestWithUser,
    @Res() res: Response,
  ) {
    const repo = dataSource.getRepository(Property);
    const property = await repo.findOneBy({ id });
    if (!property)
      return res
        .status(404)
        .json({ code: "NOT_FOUND", message: "Объект не найден" });
    if (property.ownerId !== req.user.id) {
      return res
        .status(403)
        .json({ code: "FORBIDDEN", message: "Нет доступа" });
    }
    await repo.softDelete(id);
    return res.status(204).send();
  }

  @Post("/:id/photos")
  @HttpCode(201)
  @UseBefore(authMiddleware)
  @OpenAPI({ summary: "Добавить фото объекта", security: [{ bearerAuth: [] }] })
  async addPhoto(
    @Param("id") id: number,
    @Req() req: RequestWithUser,
    @Body({ type: AddPhotoDto }) dto: AddPhotoDto,
    @Res() res: Response,
  ) {
    const repo = dataSource.getRepository(Property);
    const property = await repo.findOneBy({ id });
    if (!property)
      return res
        .status(404)
        .json({ code: "NOT_FOUND", message: "Объект не найден" });
    if (property.ownerId !== req.user.id) {
      return res
        .status(403)
        .json({ code: "FORBIDDEN", message: "Нет доступа" });
    }

    const photoRepo = dataSource.getRepository(PropertyPhoto);
    const count = await photoRepo.count({ where: { propertyId: id } });
    if (count >= 20) {
      return res
        .status(400)
        .json({
          code: "PHOTO_LIMIT_EXCEEDED",
          message: "Превышен лимит фото (20)",
        });
    }

    const photo = photoRepo.create({
      propertyId: id,
      url: dto.url,
      isMain: dto.is_main ?? false,
      sortOrder: dto.sort_order ?? count + 1,
    });
    await photoRepo.save(photo);

    return res.status(201).json({
      id: photo.id,
      url: photo.url,
      is_main: photo.isMain,
      sort_order: photo.sortOrder,
    });
  }

  @Delete("/:propertyId/photos/:photoId")
  @UseBefore(authMiddleware)
  @OpenAPI({ summary: "Удалить фото", security: [{ bearerAuth: [] }] })
  async deletePhoto(
    @Param("propertyId") propertyId: number,
    @Param("photoId") photoId: number,
    @Req() req: RequestWithUser,
    @Res() res: Response,
  ) {
    const repo = dataSource.getRepository(Property);
    const property = await repo.findOneBy({ id: propertyId });
    if (!property)
      return res
        .status(404)
        .json({ code: "NOT_FOUND", message: "Объект не найден" });
    if (property.ownerId !== req.user.id) {
      return res
        .status(403)
        .json({ code: "FORBIDDEN", message: "Нет доступа" });
    }

    const photoRepo = dataSource.getRepository(PropertyPhoto);
    const photo = await photoRepo.findOneBy({ id: photoId, propertyId });
    if (!photo)
      return res
        .status(404)
        .json({ code: "NOT_FOUND", message: "Фото не найдено" });

    await photoRepo.delete(photoId);
    return res.status(204).send();
  }

  private async _buildDetail(propertyId: number, currentUserId?: number) {
    const repo = dataSource.getRepository(Property);
    const property = await repo.findOne({
      where: { id: propertyId },
      relations: ["owner", "photos", "priceHistory"],
    });
    if (!property) return null;

    let isFavorited = false;
    if (currentUserId) {
      const fav = await dataSource
        .getRepository(Favorite)
        .findOneBy({ userId: currentUserId, propertyId });
      isFavorited = !!fav;
    }

    const reviewRepo = dataSource.getRepository(LandlordReview);
    const { sum, count } = await reviewRepo
      .createQueryBuilder("r")
      .select("COALESCE(SUM(r.rating), 0)", "sum")
      .addSelect("COUNT(r.id)", "count")
      .where("r.landlordId = :id AND r.deletedAt IS NULL", {
        id: property.ownerId,
      })
      .getRawOne<{ sum: string; count: string }>();
    const reviewsCount = parseInt(count, 10) || 0;
    const avgRating = reviewsCount ? parseFloat(sum) / reviewsCount : null;

    return {
      id: property.id,
      title: property.title,
      type: property.type,
      description: property.description ?? null,
      address: {
        street: property.street,
        building: property.building,
        apartment: property.apartment ?? null,
        postal_code: property.postalCode ?? null,
        city: property.city,
        country: property.country,
        latitude: property.latitude ?? null,
        longitude: property.longitude ?? null,
      },
      rooms: property.rooms ?? null,
      area_sqm: property.areaSqm ?? null,
      floor: property.floor ?? null,
      price_per_month: property.pricePerMonth,
      currency: property.currency,
      rental_conditions: property.rentalConditions ?? null,
      status: property.status,
      photos: property.photos.map((ph) => ({
        id: ph.id,
        url: ph.url,
        is_main: ph.isMain,
        sort_order: ph.sortOrder,
      })),
      owner: {
        id: property.owner.id,
        first_name: property.owner.firstName,
        last_name: property.owner.lastName,
        avatar_url: property.owner.avatarUrl ?? null,
        rating: avgRating,
        reviews_count: reviewsCount,
      },
      price_history: property.priceHistory.map((h) => ({
        price_per_month: h.pricePerMonth,
        currency: h.currency,
        changed_at: h.changedAt,
      })),
      average_rating: avgRating,
      is_favorited: isFavorited,
      created_at: property.createdAt,
    };
  }
}

export default PropertyController;
