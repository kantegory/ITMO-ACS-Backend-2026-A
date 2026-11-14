import { Channel } from 'amqplib';
import { getChannel, getExchangeName } from './connection';
import dataSource from '../config/data-source';
import { Booking } from '../models/booking.entity';
import { BookingRequest } from '../models/booking-request.entity';

type EventHandler = (data: Record<string, any>) => Promise<void>;

const handlers: Map<string, EventHandler[]> = new Map();

export function subscribe(eventType: string, handler: EventHandler) {
    if (!handlers.has(eventType)) {
        handlers.set(eventType, []);
    }
    handlers.get(eventType)!.push(handler);
}

export async function startConsumer(serviceName: string) {
    const channel = getChannel();
    const exchange = getExchangeName();

    // Создаем очередь для этого сервиса (временная, уникальная)
    const queue = await channel.assertQueue(`${serviceName}.queue`, { durable: true });

    // Привязываем очередь к exchange для всех eventType, которые нас интересуют
    const eventTypes = Array.from(handlers.keys());
    for (const eventType of eventTypes) {
        await channel.bindQueue(queue.queue, exchange, eventType);
    }

    console.log(`Consumer started for ${serviceName}, listening for: ${eventTypes.join(', ')}`);

    // Потребляем сообщения
    channel.consume(queue.queue, async (msg) => {
        if (!msg) return;

        try {
            const event = JSON.parse(msg.content.toString());
            const { eventType, data } = event;

            console.log(`Received event: ${eventType}`, data);

            const eventHandlers = handlers.get(eventType);
            if (eventHandlers) {
                for (const handler of eventHandlers) {
                    await handler(data);
                }
            }

            channel.ack(msg);
        } catch (error) {
            console.error('Error processing message:', error);
            channel.nack(msg, false, false); // не переотправляем
        }
    });
}


export function setupConsumers() {
    const { subscribe } = require('./consumer');

    subscribe('user.deleted', async (data: { userId: number }) => {
        console.log(`Processing user.deleted for userId: ${data.userId}`);

        const bookingRepo = dataSource.getRepository(Booking);
        const bookingRequestRepo = dataSource.getRepository(BookingRequest);

        // Отменяем все бронирования пользователя
        await bookingRepo.update(
            { tenant_id: data.userId },
            { status: 'cancelled' }
        );

        // Удаляем все заявки на бронирование пользователя
        await bookingRequestRepo.delete({ tenant_id: data.userId });

        console.log(`Cancelled bookings and deleted requests for user ${data.userId}`);
    });
}
