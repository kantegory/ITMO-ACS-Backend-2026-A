import {
  Get,
  Post,
  Body,
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

import { Transaction } from "../models/transaction.entity";
import { Rental } from "../models/rental.entity";
import {
  TransactionType,
  TransactionStatus,
  PaymentMethod,
  CurrencyType,
} from "../models/enums";

class CreateTransactionDto {
  @IsInt()
  @Type(() => Number)
  rental_id: number;

  @IsEnum(TransactionType)
  type: TransactionType;

  @IsNumber()
  @Type(() => Number)
  amount: number;

  @IsEnum(CurrencyType)
  currency: CurrencyType;

  @IsEnum(PaymentMethod)
  payment_method: PaymentMethod;

  @IsDateString()
  @IsOptional()
  period_start?: string;

  @IsDateString()
  @IsOptional()
  period_end?: string;
}

@EntityController({ baseRoute: "/transactions", entity: Transaction })
class TransactionController extends BaseController {
  @Get("")
  @UseBefore(authMiddleware)
  @OpenAPI({
    summary: "История транзакций пользователя",
    security: [{ bearerAuth: [] }],
  })
  async list(
    @Req() req: RequestWithUser,
    @QueryParam("rental_id") rentalId: number,
    @QueryParam("type") type: TransactionType,
    @QueryParam("status") status: TransactionStatus,
    @QueryParam("page") page: number = 1,
    @QueryParam("page_size") pageSize: number = 20,
    @Res() res: Response,
  ) {
    const qb = dataSource
      .getRepository(Transaction)
      .createQueryBuilder("t")
      .innerJoin("t.rental", "r")
      .where("r.renterId = :uid", { uid: req.user.id });

    if (rentalId) qb.andWhere("t.rentalId = :rentalId", { rentalId });
    if (type) qb.andWhere("t.type = :type", { type });
    if (status) qb.andWhere("t.status = :status", { status });

    qb.orderBy("t.createdAt", "DESC")
      .skip((page - 1) * pageSize)
      .take(pageSize);

    const [items, total] = await qb.getManyAndCount();

    return res.json({
      items: items.map((t) => ({
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
      total,
    });
  }

  @Post("")
  @HttpCode(201)
  @UseBefore(authMiddleware)
  @OpenAPI({ summary: "Создать транзакцию", security: [{ bearerAuth: [] }] })
  async create(
    @Req() req: RequestWithUser,
    @Body({ type: CreateTransactionDto }) dto: CreateTransactionDto,
    @Res() res: Response,
  ) {
    const rental = await dataSource
      .getRepository(Rental)
      .findOneBy({ id: dto.rental_id });
    if (!rental)
      return res
        .status(404)
        .json({ code: "NOT_FOUND", message: "Аренда не найдена" });
    if (rental.renterId !== req.user.id) {
      return res
        .status(403)
        .json({ code: "FORBIDDEN", message: "Нет доступа" });
    }

    const repo = dataSource.getRepository(Transaction);
    const transaction = repo.create({
      rentalId: dto.rental_id,
      type: dto.type,
      amount: dto.amount,
      currency: dto.currency,
      paymentMethod: dto.payment_method,
      periodStart: dto.period_start ?? null,
      periodEnd: dto.period_end ?? null,
      status: TransactionStatus.PENDING,
    });
    await repo.save(transaction);

    return res.status(201).json({
      id: transaction.id,
      type: transaction.type,
      amount: transaction.amount,
      currency: transaction.currency,
      status: transaction.status,
      payment_method: transaction.paymentMethod,
      payment_date: transaction.paymentDate ?? null,
      period_start: transaction.periodStart ?? null,
      period_end: transaction.periodEnd ?? null,
      created_at: transaction.createdAt,
    });
  }
}

export default TransactionController;
