import {
  Get,
  Post,
  Body,
  Param,
  QueryParam,
  Req,
  Res,
  UseBefore,
  HttpCode,
} from "routing-controllers";
import { OpenAPI } from "routing-controllers-openapi";
import { IsInt, IsString, IsOptional, MinLength } from "class-validator";
import { Type } from "class-transformer";
import { Response } from "express";
import { IsNull } from "typeorm";

import EntityController from "../common/entity-controller";
import BaseController from "../common/base-controller";
import authMiddleware, {
  RequestWithUser,
} from "../middlewares/auth.middleware";
import dataSource from "../config/data-source";

import { Conversation } from "../models/conversation.entity";
import { ConversationParticipant } from "../models/conversation-participant.entity";
import { Message } from "../models/message.entity";
import { User } from "../models/user.entity";

class StartConversationDto {
  @IsInt()
  @Type(() => Number)
  recipient_id: number;

  @IsInt()
  @IsOptional()
  @Type(() => Number)
  property_id?: number;

  @IsString()
  @MinLength(1)
  content: string;
}

class SendMessageDto {
  @IsString()
  @MinLength(1)
  content: string;
}

@EntityController({ baseRoute: "/conversations", entity: Conversation })
class ConversationController extends BaseController {
  @Get("")
  @UseBefore(authMiddleware)
  @OpenAPI({ summary: "Список диалогов", security: [{ bearerAuth: [] }] })
  async list(
    @Req() req: RequestWithUser,
    @QueryParam("page") page: number = 1,
    @QueryParam("page_size") pageSize: number = 20,
    @Res() res: Response,
  ) {
    const uid = req.user.id;
    const qb = dataSource
      .getRepository(Conversation)
      .createQueryBuilder("c")
      .where("c.userOneId = :uid OR c.userTwoId = :uid", { uid })
      .leftJoinAndSelect("c.userOne", "u1")
      .leftJoinAndSelect("c.userTwo", "u2")
      .leftJoinAndSelect("c.property", "p")
      .orderBy("c.updatedAt", "DESC")
      .skip((page - 1) * pageSize)
      .take(pageSize);

    const [convs, total] = await qb.getManyAndCount();

    const result = await Promise.all(
      convs.map(async (c) => {
        const companion = c.userOneId === uid ? c.userTwo : c.userOne;
        const lastMsg = await dataSource.getRepository(Message).findOne({
          where: { conversationId: c.id },
          order: { createdAt: "DESC" },
        });
        const unread = await dataSource.getRepository(Message).count({
          where: {
            conversationId: c.id,
            isRead: false,
            senderId: companion.id,
          },
        });
        return {
          id: c.id,
          companion: {
            id: companion.id,
            first_name: companion.firstName,
            last_name: companion.lastName,
            email: companion.email,
            avatar_url: companion.avatarUrl ?? null,
            roles: [],
          },
          property_title: c.property?.title ?? null,
          last_message: lastMsg?.content ?? null,
          last_message_at: lastMsg?.createdAt ?? null,
          unread_count: unread,
        };
      }),
    );

    return res.json({ items: result, total });
  }

  @Post("")
  @HttpCode(201)
  @UseBefore(authMiddleware)
  @OpenAPI({ summary: "Начать новый диалог", security: [{ bearerAuth: [] }] })
  async start(
    @Req() req: RequestWithUser,
    @Body({ type: StartConversationDto }) dto: StartConversationDto,
    @Res() res: Response,
  ) {
    const uid = req.user.id;
    const recipientId = dto.recipient_id;

    if (recipientId === uid) {
      return res
        .status(400)
        .json({
          code: "INVALID_RECIPIENT",
          message: "Нельзя начать диалог с самим собой",
        });
    }

    const recipient = await dataSource
      .getRepository(User)
      .findOneBy({ id: recipientId });
    if (!recipient)
      return res
        .status(404)
        .json({ code: "NOT_FOUND", message: "Получатель не найден" });

    const userOneId = Math.min(uid, recipientId);
    const userTwoId = Math.max(uid, recipientId);
    const propertyId = dto.property_id ?? null;

    const convRepo = dataSource.getRepository(Conversation);
    const existing = await convRepo.findOneBy({
      userOneId,
      userTwoId,
      propertyId: propertyId === null ? IsNull() : propertyId,
    });
    if (existing) {
      return res
        .status(409)
        .json({
          code: "CONVERSATION_EXISTS",
          message: "Диалог уже существует",
        });
    }

    const conv = convRepo.create({ userOneId, userTwoId, propertyId });
    await convRepo.save(conv);

    const partRepo = dataSource.getRepository(ConversationParticipant);
    await partRepo.save([
      partRepo.create({ conversationId: conv.id, userId: userOneId }),
      partRepo.create({ conversationId: conv.id, userId: userTwoId }),
    ]);

    const msgRepo = dataSource.getRepository(Message);
    const msg = msgRepo.create({
      conversationId: conv.id,
      senderId: uid,
      content: dto.content,
    });
    await msgRepo.save(msg);

    await this._touchConversation(conv.id);

    return res.status(201).json(await this._buildDetail(conv.id, uid, 1, 20));
  }

  @Get("/:id")
  @UseBefore(authMiddleware)
  @OpenAPI({
    summary: "Получить диалог с сообщениями",
    security: [{ bearerAuth: [] }],
  })
  async getById(
    @Param("id") id: number,
    @Req() req: RequestWithUser,
    @QueryParam("page") page: number = 1,
    @QueryParam("page_size") pageSize: number = 20,
    @Res() res: Response,
  ) {
    const conv = await dataSource.getRepository(Conversation).findOneBy({ id });
    if (!conv)
      return res
        .status(404)
        .json({ code: "NOT_FOUND", message: "Диалог не найден" });

    const uid = req.user.id;
    if (conv.userOneId !== uid && conv.userTwoId !== uid) {
      return res
        .status(403)
        .json({ code: "FORBIDDEN", message: "Нет доступа" });
    }

    return res.json(await this._buildDetail(id, uid, page, pageSize));
  }

  @Post("/:id/messages")
  @HttpCode(201)
  @UseBefore(authMiddleware)
  @OpenAPI({ summary: "Отправить сообщение", security: [{ bearerAuth: [] }] })
  async sendMessage(
    @Param("id") id: number,
    @Req() req: RequestWithUser,
    @Body({ type: SendMessageDto }) dto: SendMessageDto,
    @Res() res: Response,
  ) {
    const conv = await dataSource.getRepository(Conversation).findOneBy({ id });
    if (!conv)
      return res
        .status(404)
        .json({ code: "NOT_FOUND", message: "Диалог не найден" });

    const uid = req.user.id;
    if (conv.userOneId !== uid && conv.userTwoId !== uid) {
      return res
        .status(403)
        .json({ code: "FORBIDDEN", message: "Нет доступа" });
    }

    const msgRepo = dataSource.getRepository(Message);
    const msg = msgRepo.create({
      conversationId: id,
      senderId: uid,
      content: dto.content,
    });
    await msgRepo.save(msg);

    await this._touchConversation(id);

    return res.status(201).json({
      id: msg.id,
      sender_id: msg.senderId,
      content: msg.content,
      is_read: msg.isRead,
      created_at: msg.createdAt,
    });
  }

  @Post("/:id/read")
  @UseBefore(authMiddleware)
  @OpenAPI({
    summary: "Отметить сообщения как прочитанные",
    security: [{ bearerAuth: [] }],
  })
  async markRead(
    @Param("id") id: number,
    @Req() req: RequestWithUser,
    @Res() res: Response,
  ) {
    const conv = await dataSource.getRepository(Conversation).findOneBy({ id });
    if (!conv)
      return res
        .status(404)
        .json({ code: "NOT_FOUND", message: "Диалог не найден" });

    const uid = req.user.id;
    if (conv.userOneId !== uid && conv.userTwoId !== uid) {
      return res
        .status(403)
        .json({ code: "FORBIDDEN", message: "Нет доступа" });
    }

    await dataSource
      .getRepository(Message)
      .createQueryBuilder()
      .update(Message)
      .set({ isRead: true })
      .where("conversationId = :id", { id })
      .andWhere("isRead = false")
      .andWhere("senderId != :uid", { uid })
      .execute();

    return res.json({ message: "Прочитано" });
  }

  private async _touchConversation(convId: number) {
    await dataSource
      .getRepository(Conversation)
      .createQueryBuilder()
      .update(Conversation)
      .set({ updatedAt: () => "CURRENT_TIMESTAMP" })
      .where("id = :id", { id: convId })
      .execute();
  }

  private async _buildDetail(
    convId: number,
    currentUserId: number,
    page: number,
    pageSize: number,
  ) {
    const conv = await dataSource.getRepository(Conversation).findOne({
      where: { id: convId },
      relations: ["userOne", "userTwo", "property"],
    });
    const companion =
      conv.userOneId === currentUserId ? conv.userTwo : conv.userOne;

    const msgRepo = dataSource.getRepository(Message);
    const [messages, totalMessages] = await msgRepo.findAndCount({
      where: { conversationId: convId },
      order: { createdAt: "DESC" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    return {
      id: conv.id,
      companion: {
        id: companion.id,
        first_name: companion.firstName,
        last_name: companion.lastName,
        email: companion.email,
        avatar_url: companion.avatarUrl ?? null,
        roles: [],
      },
      property: conv.property
        ? {
            id: conv.property.id,
            title: conv.property.title,
            type: conv.property.type,
            city: conv.property.city,
            price_per_month: conv.property.pricePerMonth,
            currency: conv.property.currency,
            rooms: conv.property.rooms ?? null,
            area_sqm: conv.property.areaSqm ?? null,
            main_photo_url: null,
            status: conv.property.status,
            is_favorited: false,
          }
        : null,
      messages: messages.map((m) => ({
        id: m.id,
        sender_id: m.senderId,
        content: m.content,
        is_read: m.isRead,
        created_at: m.createdAt,
      })),
      total_messages: totalMessages,
      page,
      page_size: pageSize,
    };
  }
}

export default ConversationController;
