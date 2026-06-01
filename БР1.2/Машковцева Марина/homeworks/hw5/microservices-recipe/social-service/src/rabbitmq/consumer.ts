import amqp from 'amqplib';
import { AppDataSource } from '../data-source';
import { User } from '../models/User';

export async function consumeUserEvents() {
    try {
        const connection = await amqp.connect('amqp://localhost:5672');
        const channel = await connection.createChannel();

        await channel.assertQueue('user_events', { durable: true });

        console.log('Social Service waiting for messages in user_events queue');

        channel.consume('user_events', async (msg) => {
            if (msg) {
                const content = JSON.parse(msg.content.toString());
                console.log('Received event:', content);

                if (content.event === 'USER_CREATED') {
                    const { id, username, email } = content.data;
                    const userRepo = AppDataSource.getRepository(User);

                    const existingUser = await userRepo.findOneBy({ id });
                    if (!existingUser) {
                        const newUser = userRepo.create({ id, username, email });
                        await userRepo.save(newUser);
                        console.log(`User ${username} synced to Social Service DB`);
                    }
                }
                channel.ack(msg);
            }
        });
    } catch (error) {
        console.error('Failed to consume messages from RabbitMQ', error);
    }
}