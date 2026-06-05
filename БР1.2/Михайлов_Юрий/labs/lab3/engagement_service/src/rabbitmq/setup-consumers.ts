import dataSource from '../config/data-source';
import { Conversation } from '../models/conversation.entity';
import { Message } from '../models/message.entity';
import { Review } from '../models/review.entity';

export function setupConsumers() {
    const { subscribe } = require('./consumer');

    // 1. Автосоздание чата при заявке на бронирование
    subscribe('booking_request.created', async (data: {
        bookingRequestId: number;
        propertyId: number;
        tenantId: number;
        ownerId: number;
        comments: string;
    }) => {
        console.log(`Creating conversation for booking request ${data.bookingRequestId}`);

        const conversationRepo = dataSource.getRepository(Conversation);

        // Проверяем, нет ли уже чата между этими пользователями по этому объекту
        const existing = await conversationRepo.findOne({
            where: {
                property_id: data.propertyId,
                user1_id: data.tenantId,
                user2_id: data.ownerId
            }
        });

        if (existing) {
            console.log(`Conversation already exists: ${existing.id}`);
            return;
        }

        // Создаем новый чат
        const conversation = conversationRepo.create({
            user1_id: data.tenantId,
            user2_id: data.ownerId,
            property_id: data.propertyId
        });

        const saved = await conversationRepo.save(conversation);
        console.log(`Created conversation ${saved.id} for booking request ${data.bookingRequestId}`);
    });

    // 2. Удаление данных пользователя
    subscribe('user.deleted', async (data: { userId: number }) => {
        console.log(`Engagement Service: Processing user.deleted for userId: ${data.userId}`);

        const reviewRepo = dataSource.getRepository(Review);
        const conversationRepo = dataSource.getRepository(Conversation);
        const messageRepo = dataSource.getRepository(Message);

        // Удаляем отзывы пользователя
        await reviewRepo.delete({ user_id: data.userId });

        // Находим все чаты пользователя
        const conversations = await conversationRepo.find({
            where: [
                { user1_id: data.userId },
                { user2_id: data.userId }
            ]
        });

        // Удаляем сообщения из этих чатов
        for (const conv of conversations) {
            await messageRepo.delete({ conversation_id: conv.id });
        }

        // Удаляем сами чаты
        await conversationRepo.delete([
            { user1_id: data.userId },
            { user2_id: data.userId }
        ]);

        console.log(`Deleted reviews, conversations and messages for user ${data.userId}`);
    });
}
