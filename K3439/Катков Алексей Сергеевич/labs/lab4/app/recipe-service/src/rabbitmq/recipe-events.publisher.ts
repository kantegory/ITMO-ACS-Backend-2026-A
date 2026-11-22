import * as amqp from 'amqplib';

const RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqp://guest:guest@localhost:5672';
const EXCHANGE_NAME = 'recipe.events';
const ROUTING_KEY = 'recipe.created';

export type RecipeCreatedEvent = {
    event: 'recipe.created';
    recipeId: number;
    title: string;
    authorId: number;
    createdAt: string;
};

export async function publishRecipeCreated(event: RecipeCreatedEvent) {
    const connection = await amqp.connect(RABBITMQ_URL);
    const channel = await connection.createChannel();

    try {
        await channel.assertExchange(EXCHANGE_NAME, 'topic', {
            durable: true,
        });

        channel.publish(
            EXCHANGE_NAME,
            ROUTING_KEY,
            Buffer.from(JSON.stringify(event)),
            {
                contentType: 'application/json',
                persistent: true,
            },
        );

        console.log('[RabbitMQ] Sent recipe.created event:', event);
    } finally {
        await channel.close();
        await connection.close();
    }
}
