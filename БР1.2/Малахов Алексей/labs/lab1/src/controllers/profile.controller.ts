import {
  Get,
  Patch,
  Post,
  Body,
  Req,
  Res,
  UseBefore,
} from "routing-controllers";
import { OpenAPI } from "routing-controllers-openapi";
import { IsString, IsOptional, IsEnum } from "class-validator";
import { Type } from "class-transformer";
import { Response } from "express";

import EntityController from "../common/entity-controller";
import BaseController from "../common/base-controller";
import authMiddleware, {
  RequestWithUser,
} from "../middlewares/auth.middleware";
import dataSource from "../config/data-source";

import { User } from "../models/user.entity";
import { UserRoleEntity } from "../models/user-role.entity";
import { Rental } from "../models/rental.entity";
import { Transaction } from "../models/transaction.entity";
import { Message } from "../models/message.entity";
import { Favorite } from "../models/favorite.entity";
import { RentalStatus, UserRole } from "../models/enums";

class UpdateProfileDto {
  @IsString()
  @IsOptional()
  @Type(() => String)
  first_name?: string;

  @IsString()
  @IsOptional()
  @Type(() => String)
  last_name?: string;

  @IsString()
  @IsOptional()
  @Type(() => String)
  phone?: string;

  @IsString()
  @IsOptional()
  @Type(() => String)
  avatar_url?: string;
}

class AddRoleDto {
  @IsEnum(UserRole)
  role: UserRole;
}

function buildProfile(user: User, roles: UserRoleEntity[]) {
  return {
    id: user.id,
    first_name: user.firstName,
    last_name: user.lastName,
    email: user.email,
    phone: user.phone ?? null,
    avatar_url: user.avatarUrl ?? null,
    is_verified: user.isVerified,
    roles: roles.map((r) => r.role),
    created_at: user.createdAt,
  };
}

@EntityController({ baseRoute: "/profile", entity: User })
class ProfileController extends BaseController {
  @Get("")
  @UseBefore(authMiddleware)
  @OpenAPI({
    summary: "Получить профиль текущего пользователя",
    security: [{ bearerAuth: [] }],
  })
  async getProfile(@Req() req: RequestWithUser, @Res() res: Response) {
    const userRepo = dataSource.getRepository(User);
    const user = await userRepo.findOneBy({ id: req.user.id });
    if (!user)
      return res
        .status(404)
        .json({ code: "NOT_FOUND", message: "Пользователь не найден" });

    const roles = await dataSource
      .getRepository(UserRoleEntity)
      .findBy({ userId: user.id });
    return res.json(buildProfile(user, roles));
  }

  @Patch("")
  @UseBefore(authMiddleware)
  @OpenAPI({ summary: "Обновить профиль", security: [{ bearerAuth: [] }] })
  async updateProfile(
    @Req() req: RequestWithUser,
    @Body({ type: UpdateProfileDto }) dto: UpdateProfileDto,
    @Res() res: Response,
  ) {
    const userRepo = dataSource.getRepository(User);
    const user = await userRepo.findOneBy({ id: req.user.id });
    if (!user)
      return res
        .status(404)
        .json({ code: "NOT_FOUND", message: "Пользователь не найден" });

    if (dto.first_name !== undefined) user.firstName = dto.first_name;
    if (dto.last_name !== undefined) user.lastName = dto.last_name;
    if (dto.phone !== undefined) user.phone = dto.phone;
    if (dto.avatar_url !== undefined) user.avatarUrl = dto.avatar_url;

    await userRepo.save(user);
    const roles = await dataSource
      .getRepository(UserRoleEntity)
      .findBy({ userId: user.id });
    return res.json(buildProfile(user, roles));
  }

  @Get("/dashboard")
  @UseBefore(authMiddleware)
  @OpenAPI({ summary: "Дашборд пользователя", security: [{ bearerAuth: [] }] })
  async getDashboard(@Req() req: RequestWithUser, @Res() res: Response) {
    const userId = req.user.id;

    const userRepo = dataSource.getRepository(User);
    const user = await userRepo.findOneBy({ id: userId });
    if (!user)
      return res
        .status(404)
        .json({ code: "NOT_FOUND", message: "Пользователь не найден" });

    const roles = await dataSource
      .getRepository(UserRoleEntity)
      .findBy({ userId: user.id });

    const activeRentals = await dataSource.getRepository(Rental).find({
      where: [
        { renterId: userId, status: RentalStatus.ACTIVE },
        { renterId: userId, status: RentalStatus.PENDING },
      ],
      relations: ["property"],
      take: 5,
    });

    const recentTransactions = await dataSource
      .getRepository(Transaction)
      .find({
        where: { rental: { renterId: userId } },
        relations: ["rental"],
        order: { createdAt: "DESC" },
        take: 5,
      });

    const unreadMessages = await dataSource
      .getRepository(Message)
      .createQueryBuilder("m")
      .innerJoin("m.conversation", "c")
      .where("m.isRead = false")
      .andWhere("m.senderId != :uid", { uid: userId })
      .andWhere("(c.userOneId = :uid OR c.userTwoId = :uid)", { uid: userId })
      .getCount();

    const favCount = await dataSource
      .getRepository(Favorite)
      .count({ where: { userId } });

    return res.json({
      profile: buildProfile(user, roles),
      active_rentals: activeRentals.map((r) => ({
        id: r.id,
        property_title: r.property?.title,
        property_main_photo: null,
        city: r.property?.city,
        agreed_price: r.agreedPrice,
        currency: r.currency,
        start_date: r.startDate,
        end_date: r.endDate ?? null,
        status: r.status,
      })),
      recent_transactions: recentTransactions.map((t) => ({
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
      unread_messages_count: unreadMessages,
      favorites_count: favCount,
    });
  }

  @Post("/roles")
  @UseBefore(authMiddleware)
  @OpenAPI({
    summary: "Добавить роль пользователю",
    security: [{ bearerAuth: [] }],
  })
  async addRole(
    @Req() req: RequestWithUser,
    @Body({ type: AddRoleDto }) dto: AddRoleDto,
    @Res() res: Response,
  ) {
    const roleRepo = dataSource.getRepository(UserRoleEntity);
    const existing = await roleRepo.findOneBy({
      userId: req.user.id,
      role: dto.role,
    });
    if (existing) {
      return res
        .status(409)
        .json({ code: "ROLE_ALREADY_ASSIGNED", message: "Роль уже назначена" });
    }

    const userRole = roleRepo.create({ userId: req.user.id, role: dto.role });
    await roleRepo.save(userRole);

    const userRepo = dataSource.getRepository(User);
    const user = await userRepo.findOneBy({ id: req.user.id });
    const roles = await roleRepo.findBy({ userId: req.user.id });

    return res.status(201).json(buildProfile(user, roles));
  }
}

export default ProfileController;
