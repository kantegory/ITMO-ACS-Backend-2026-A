import amqp from 'amqplib';
import { prisma } from '../config/database.js';

const EXCHANGE_NAME = 'user-exchange';
let channel: amqp.Channel | null = null;

export async function connectRabbitMQ(): Promise<void> {
    try {
        const url = process.env.RABBITMQ_URL || 'amqp://guest:guest@localhost:5672';
        const connection = await amqp.connect(url);
        channel = await connection.createChannel();
        await channel.assertExchange(EXCHANGE_NAME, 'topic', { durable: true });
        
        // Создаём очередь и привязываем к exchange для получения событий
        const queue = await channel.assertQueue('recipe-service-queue', { durable: true });
        await channel.bindQueue(queue.queue, EXCHANGE_NAME, 'user.*');
        
        // Потребляем сообщения
        channel.consume(queue.queue, async (msg) => {
            if (!msg) return;
            const routingKey = msg.fields.routingKey;
            const content = msg.content.toString();
            console.log(`[RabbitMQ] Received event: ${routingKey} -> ${content}`);
            
            try {
                const data = JSON.parse(content);
                if (routingKey === 'user.deleted') {
                    await handleUserDeleted(data.userId);
                }
                channel!.ack(msg);
            } catch (error) {
                console.error(`[RabbitMQ] Error processing event:`, error);
                channel!.nack(msg, false, false);
            }
        });
        
        console.log('[RabbitMQ] Connected and consuming events');
    } catch (error) {
        console.error('[RabbitMQ] Connection failed:', error);
    }
}

async function handleUserDeleted(userId: number): Promise<void> {
    console.log(`[RabbitMQ] Handling user.deleted for userId=${userId}`);
    
    // Удаляем все рецепты пользователя (каскадно удалятся связанные данные)
    await prisma.recipe.deleteMany({
        where: { authorId: userId },
    });
    
    // Удаляем комментарии пользователя
    await prisma.comment.deleteMany({
        where: { userId },
    });
    
    // Удаляем лайки комментариев пользователя
    await prisma.commentLike.deleteMany({
        where: { userId },
    });
    
    // Удаляем рейтинги пользователя
    await prisma.recipeRating.deleteMany({
        where: { userId },
    });
    
    // Удаляем сохранённые рецепты пользователя
    await prisma.savedRecipe.deleteMany({
        where: { userId },
    });
    
    console.log(`[RabbitMQ] Cleaned up data for userId=${userId}`);
}