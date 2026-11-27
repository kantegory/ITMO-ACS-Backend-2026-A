import {
    BadRequestError,
    Body,
    ForbiddenError,
    Get,
    Param,
    Post,
    Req,
    UseBefore,
} from 'routing-controllers';
import { OpenAPI } from 'routing-controllers-openapi';
import { IsInt } from 'class-validator';
import { Type } from 'class-transformer';

import EntityController from '../common/entity-controller';
import BaseController from '../common/base-controller';
import authMiddleware, { RequestWithUser } from '../middlewares/auth.middleware';
import dataSource from '../config/data-source';

import { Conversation } from '../models/conversation.entity';
import { Message } from '../models/message.entity';
import {ObjectLiteral} from "typeorm";

class CreateConversationDto {
    @IsInt()
    @Type(() => Number)
    user1_id: number;

    @IsInt()
    @Type(() => Number)
    user2_id: number;

    @IsInt()
    @Type(() => Number)
    property_id: number;
}

@EntityController({
    baseRoute: '/conversations',
    entity: Conversation,
})
class ConversationsController extends BaseController {

    @UseBefore(authMiddleware)
    @Get('')
    @OpenAPI({ security: [{ bearerAuth: [] }] })
    async list(@Req() request: RequestWithUser): Promise<ObjectLiteral[]> {
        const { user } = request;
        return await this.repository
            .createQueryBuilder('c')
            .where('c.user1_id = :id OR c.user2_id = :id', { id: user.id })
            .getMany();
    }

    @UseBefore(authMiddleware)
    @Post('')
    @OpenAPI({ security: [{ bearerAuth: [] }] })
    async create(
        @Req() request: RequestWithUser,
        @Body({ type: CreateConversationDto }) body: CreateConversationDto,
    ): Promise<{ id: number }> {
        const { user } = request;
        if (body.user1_id !== user.id && body.user2_id !== user.id) {
            throw new BadRequestError('User is not participant');
        }
        if (body.user1_id === body.user2_id) {
            throw new BadRequestError('Conversation requires two users');
        }

        const created = this.repository.create(body);
        const saved = await this.repository.save(created);
        return { id: saved.id };
    }

    @UseBefore(authMiddleware)
    @Get('/:id/messages')
    @OpenAPI({ security: [{ bearerAuth: [] }] })
    async messages(
        @Req() request: RequestWithUser,
        @Param('id') id: number,
    ): Promise<Message[]> {
        const { user } = request;
        const conversation = await this.repository.findOneBy({ id });
        if (!conversation) return [];

        const isParticipant =
            conversation.user1_id === user.id || conversation.user2_id === user.id;
        if (!isParticipant) throw new ForbiddenError();

        const messageRepo = dataSource.getRepository(Message);
        return await messageRepo.findBy({ conversation_id: id });
    }
}

export default ConversationsController;

