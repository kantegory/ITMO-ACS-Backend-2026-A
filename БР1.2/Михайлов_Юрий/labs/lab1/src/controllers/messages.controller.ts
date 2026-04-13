import {
    Body,
    ForbiddenError,
    Post,
    Req,
    UseBefore,
} from 'routing-controllers';

import EntityController from '../common/entity-controller';
import BaseController from '../common/base-controller';
import authMiddleware, { RequestWithUser } from '../middlewares/auth.middleware';
import dataSource from '../config/data-source';

import { Message } from '../models/message.entity';
import { Conversation } from '../models/conversation.entity';

@EntityController({
    baseRoute: '/messages',
    entity: Message,
})
class MessagesController extends BaseController {
    @UseBefore(authMiddleware)
    @Post('')
    async send(
        @Req() request: RequestWithUser,
        @Body() body: { conversation_id: number; content: string },
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

