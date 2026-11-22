import amqp, { Channel } from 'amqplib';

import SETTINGS from '../config/settings';

export const RECIPE_DELETED_QUEUE = 'recipe.deleted';

let channel: Channel | null = null;

const getChannel = async (): Promise<Channel> => {
    if (!channel) {
        const connection = await amqp.connect(SETTINGS.RABBITMQ_URL);
        channel = await connection.createChannel();

        await channel.assertQueue(RECIPE_DELETED_QUEUE, { durable: true });
    }

    return channel;
};


export const publishRecipeDeleted = async (recipeId: number) => {
    const channel = await getChannel();
    const message = JSON.stringify({ recipe_id: recipeId });

    channel.sendToQueue(RECIPE_DELETED_QUEUE, Buffer.from(message), {
        persistent: true,
    });
};
