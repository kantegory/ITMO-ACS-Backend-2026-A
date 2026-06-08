import { Brackets } from 'typeorm';
import { consumeEvents } from '../../shared/broker';
import dataSource from './data-source';
import { Conversation } from './models/conversation.entity';

/**
 * Messaging подписывается на событие подтверждения брони и автоматически
 * открывает диалог между арендатором и владельцем объекта (если его ещё нет).
 * Демонстрирует обработку ОДНОГО события несколькими сервисами (Catalog + Messaging).
 */
export async function startMessagingConsumers() {
    const conversations = dataSource.getRepository(Conversation);

    await consumeEvents('messaging.booking-events', ['booking.confirmed'], async (event, payload) => {
        const { tenantId, ownerId, propertyId } = payload;
        if (!tenantId || !ownerId) return;

        const existing = await conversations
            .createQueryBuilder('c')
            .where(
                new Brackets((qb) => {
                    qb.where('c.participantAId = :a AND c.participantBId = :b', { a: tenantId, b: ownerId })
                      .orWhere('c.participantAId = :b AND c.participantBId = :a', { a: tenantId, b: ownerId });
                }),
            )
            .getOne();
        if (existing) return;

        const conversation = conversations.create({ participantAId: tenantId, participantBId: ownerId, propertyId: propertyId ?? null });
        await conversations.save(conversation);
        console.log(`   [messaging] открыт диалог ${conversation.id} (арендатор ${tenantId} ↔ владелец ${ownerId}) по событию ${event}`);
    });
}
