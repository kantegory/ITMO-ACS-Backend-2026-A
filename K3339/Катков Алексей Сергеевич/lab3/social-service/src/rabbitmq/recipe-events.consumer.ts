import * as amqp from 'amqplib';

const RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqp://guest:guest@localhost:5672';
const EXCHANGE_NAME = 'recipe.events';
const QUEUE_NAME = 'social-service.recipe-created';
const ROUTING_KEY = 'recipe.created';

type RecipeCreatedEvent = {
    event: 'recipe.created';
    recipeId: number;
    title: string;
    authorId: number;
    createdAt: string;
};

export async function startRecipeEventsConsumer() {
    const connection = await amqp.connect(RABBITMQ_URL);
    const channel = await connection.createChannel();

    await channel.assertExchange(EXCHANGE_NAME, 'topic', {
        durable: true,
    });

    await channel.assertQueue(QUEUE_NAME, {
        durable: true,
    });

    await channel.bindQueue(QUEUE_NAME, EXCHANGE_NAME, ROUTING_KEY);

    console.log('[RabbitMQ] social-service is waiting for recipe.created events');

    channel.consume(QUEUE_NAME, (message) => {
        if (!message) {
            return;
        }

        try {
            const event = JSON.parse(message.content.toString()) as RecipeCreatedEvent;

            console.log('[RabbitMQ] Received recipe.created event in social-service:', {
                recipeId: event.recipeId,
                title: event.title,
                authorId: event.authorId,
                createdAt: event.createdAt,
            });

            channel.ack(message);
        } catch (error) {
            console.error('[RabbitMQ] Failed to process recipe.created event:', error);
            channel.nack(message, false, false);
        }
    });
}
