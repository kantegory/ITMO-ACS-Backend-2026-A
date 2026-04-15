import {
    Body,
    ForbiddenError,
    Post,
    Req,
    UseBefore,
} from 'routing-controllers';
import { OpenAPI } from 'routing-controllers-openapi';
import { IsInt, IsString } from 'class-validator';
import { Type } from 'class-transformer';

import EntityController from '../common/entity-controller';
import BaseController from '../common/base-controller';
import authMiddleware, { RequestWithUser } from '../middlewares/auth.middleware';
import dataSource from '../config/data-source';

import { Message } from '../models/message.entity';
import { Conversation } from '../models/conversation.entity';

class SendMessageDto {
    @IsInt()
    @Type(() => Number)
    conversation_id: number;

    @IsString()
    @Type(() => String)
    content: string;
}

@EntityController({
    baseRoute: '/messages',
    entity: Message,
})
class MessagesController extends BaseController {
    @UseBefore(authMiddleware)
    @Post('')
    @OpenAPI({ security: [{ bearerAuth: [] }] })
    async send(
        @Req() request: RequestWithUser,
        @Body({ type: SendMessageDto }) body: SendMessageDto,
    ): Promise<{ id: number }> {
        const { user } = request;

        const convRepo = dataSource.getRepository(Conversation);
        const conversation = await convRepo.findOneBy({
            id: body.conversation_id,
        });
        if (!conversation) throw new ForbiddenError();

        const isParticipant =
            conversation.user1_id === user.id || conversation.user2_id === user.id;
        if (!isParticipant) throw new ForbiddenError();

        const created = this.repository.create({
            conversation_id: body.conversation_id,
            content: body.content,
            sender_id: user.id,
        });
        const saved = await this.repository.save(created);
        return { id: saved.id };
    }
}

export default MessagesController;

