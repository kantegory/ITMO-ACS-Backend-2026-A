import {
    Get,
    Post,
    Patch,
    Param,
    QueryParam,
    Body,
    Req,
    UseBefore,
    HttpCode,
    OnUndefined,
    NotFoundError,
    ForbiddenError,
} from 'routing-controllers';
import { OpenAPI } from 'routing-controllers-openapi';
import { Brackets } from 'typeorm';

import EntityController from '../common/entity-controller';
import BaseController from '../common/base-controller';
import dataSource from '../config/data-source';

import { Conversation } from '../models/conversation.entity';
import { Message } from '../models/message.entity';

import authMiddleware, {
    RequestWithUser,
} from '../middlewares/auth.middleware';
import {
    CreateConversationDto,
    CreateMessageDto,
} from '../dto/conversation.dto';
import { paginate } from '../utils/paginate';

@EntityController({ baseRoute: '/conversations', entity: Conversation })
class ConversationController extends BaseController {
    private messages = dataSource.getRepository(Message);

    private async assertParticipant(conversationId: number, userId: number) {
        const conversation = await this.repository.findOneBy({
            id: conversationId,
        });
        if (!conversation) throw new NotFoundError('Диалог не найден');
        if (
            conversation.participantAId !== userId &&
            conversation.participantBId !== userId
        ) {
            throw new ForbiddenError('Нет доступа к этому диалогу');
        }
        return conversation;
    }

    @Get('')
    @UseBefore(authMiddleware)
    @OpenAPI({ summary: 'Список диалогов пользователя', security: [{ bearerAuth: [] }] })
    async list(
        @Req() req: RequestWithUser,
        @QueryParam('page') page: number,
        @QueryParam('limit') limit: number,
    ) {
        const qb = this.repository
            .createQueryBuilder('c')
            .where('c.participantAId = :id OR c.participantBId = :id', {
                id: req.user.id,
            })
            .orderBy('c.createdAt', 'DESC');
        return paginate(qb, page, limit);
    }

    @Post('')
    @HttpCode(201)
    @UseBefore(authMiddleware)
    @OpenAPI({ summary: 'Начать диалог', security: [{ bearerAuth: [] }] })
    async create(
        @Req() req: RequestWithUser,
        @Body() data: CreateConversationDto,
    ) {
        const me = req.user.id;
        // ищем существующий диалог между этими пользователями
        const existing = await this.repository
            .createQueryBuilder('c')
            .where(
                new Brackets((qb) => {
                    qb.where(
                        'c.participantAId = :me AND c.participantBId = :other',
                        { me, other: data.recipientId },
                    ).orWhere(
                        'c.participantAId = :other AND c.participantBId = :me',
                        { me, other: data.recipientId },
                    );
                }),
            )
            .getOne();
        if (existing) return existing;

        const conversation = this.repository.create({
            participantAId: me,
            participantBId: data.recipientId,
            propertyId: data.propertyId ?? null,
        });
        return this.repository.save(conversation);
    }

    @Get('/:id/messages')
    @UseBefore(authMiddleware)
    @OpenAPI({ summary: 'История сообщений диалога', security: [{ bearerAuth: [] }] })
    async messagesList(
        @Req() req: RequestWithUser,
        @Param('id') id: number,
        @QueryParam('page') page: number,
        @QueryParam('limit') limit: number,
    ) {
        await this.assertParticipant(id, req.user.id);
        const qb = this.messages
            .createQueryBuilder('m')
            .where('m.conversationId = :id', { id })
            .orderBy('m.sentAt', 'ASC');
        return paginate(qb, page, limit);
    }

    @Post('/:id/messages')
    @HttpCode(201)
    @UseBefore(authMiddleware)
    @OpenAPI({ summary: 'Отправить сообщение', security: [{ bearerAuth: [] }] })
    async sendMessage(
        @Req() req: RequestWithUser,
        @Param('id') id: number,
        @Body() data: CreateMessageDto,
    ) {
        await this.assertParticipant(id, req.user.id);
        const message = this.messages.create({
            conversationId: id,
            senderId: req.user.id,
            body: data.body,
            isRead: false,
        });
        return this.messages.save(message);
    }

    @Patch('/:id/read')
    @UseBefore(authMiddleware)
    @OnUndefined(204)
    @OpenAPI({ summary: 'Отметить сообщения прочитанными', security: [{ bearerAuth: [] }] })
    async markRead(@Req() req: RequestWithUser, @Param('id') id: number) {
        await this.assertParticipant(id, req.user.id);
        await this.messages
            .createQueryBuilder()
            .update(Message)
            .set({ isRead: true })
            .where('conversationId = :id AND senderId != :me', {
                id,
                me: req.user.id,
            })
            .execute();
        return undefined;
    }
}

export default ConversationController;
