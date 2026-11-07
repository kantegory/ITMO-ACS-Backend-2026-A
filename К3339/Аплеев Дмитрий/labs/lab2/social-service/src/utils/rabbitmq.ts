import amqp from 'amqplib';

import SETTINGS from '../config/settings';
import dataSource from '../config/data-source';

import { Comment } from '../models/comment.entity';
import { Like } from '../models/like.entity';
import { SavedRecipe } from '../models/saved-recipe.entity';


export const RECIPE_DELETED_QUEUE = 'recipe.deleted';


const deleteRecipeData = async (recipeId: number) => {
    await dataSource.getRepository(Comment).delete({ recipe_id: recipeId });
    await dataSource.getRepository(Like).delete({ recipe_id: recipeId });
    await dataSource.getRepository(SavedRecipe).delete({ recipe_id: recipeId });
};

export const startRecipeDeletedConsumer = async () => {
    try {
        const connection = await amqp.connect(SETTINGS.RABBITMQ_URL);
        const channel = await connection.createChannel();

        await channel.assertQueue(RECIPE_DELETED_QUEUE, { durable: true });

        await channel.consume(RECIPE_DELETED_QUEUE, async (message) => {
            if (!message) {
                return;
            }

            const { recipe_id } = JSON.parse(message.content.toString());

            try {
                await deleteRecipeData(recipe_id);
                console.log(
                    `recipe ${recipe_id} deleted: comments, likes and saves removed`,
                );

                channel.ack(message);
            } catch (error) {
                console.error('Failed to process message:', error);

                // nack — вернуть сообщение в очередь, чтобы попробовать ещё раз
                channel.nack(message, false, true);
            }
        });

        console.log(`Listening to RabbitMQ queue "${RECIPE_DELETED_QUEUE}"`);
    } catch (error) {
        console.error('RabbitMQ is unavailable, retry in 5 seconds');
        setTimeout(startRecipeDeletedConsumer, 5000);
    }
};
