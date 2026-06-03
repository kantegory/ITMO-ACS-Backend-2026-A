import amqp from 'amqplib';
import axios from 'axios';
import SETTINGS from '../config/settings';
import dataSource from '../config/data-source';
import { Restaurant } from '../models/restaurant.entity';

export async function startReviewConsumer(): Promise<void> {
    try {
        const connection = await amqp.connect(SETTINGS.RABBITMQ_URL);
        const channel = await connection.createChannel();
        const exchange = 'reviews';

        await channel.assertExchange(exchange, 'topic', { durable: true });

        const q = await channel.assertQueue('restaurant-service.reviews', { durable: true });
        await channel.bindQueue(q.queue, exchange, 'review.created');
        await channel.bindQueue(q.queue, exchange, 'review.deleted');

        console.log('[RabbitMQ] Listening for review events...');

        channel.consume(q.queue, async (msg) => {
            if (!msg) return;
            try {
                const event = JSON.parse(msg.content.toString());
                const restaurantId: number = event.restaurant_id;

                if (!restaurantId) {
                    channel.ack(msg);
                    return;
                }

                // Fetch all reviews for this restaurant from review-service
                const { data: reviews } = await axios.get(
                    `${SETTINGS.REVIEW_SERVICE_URL}/internal/reviews`,
                    { params: { restaurant_id: restaurantId } },
                );

                let newRating: number | null = null;
                if (Array.isArray(reviews) && reviews.length > 0) {
                    const sum = reviews.reduce((acc: number, r: any) => acc + Number(r.rating), 0);
                    newRating = Math.round((sum / reviews.length) * 100) / 100;
                }

                const repo = dataSource.getRepository(Restaurant);
                await repo.update({ restaurant_id: restaurantId }, { rating: newRating });
                console.log(`[Consumer] Updated rating for restaurant ${restaurantId}:`, newRating);

                channel.ack(msg);
            } catch (err) {
                console.error('[Consumer] Error processing review event:', err);
                channel.nack(msg, false, false);
            }
        });
    } catch (err) {
        console.error('[RabbitMQ] Failed to start review consumer:', err);
    }
}
