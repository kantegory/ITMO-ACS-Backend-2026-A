import amqp, { Channel, ChannelModel } from 'amqplib';

let connection: ChannelModel;
let channel: Channel;

export async function connectRabbitMQ() {
    try {
        connection = await amqp.connect('amqp://localhost:5672');
        channel = await connection.createChannel();
        
        await channel.assertQueue('user_events', { durable: true });
        
        console.log('User Service connected to RabbitMQ');
    } catch (error) {
        console.error('Failed to connect to RabbitMQ', error);
    }
}

export async function sendUserCreatedEvent(user: { id: number; username: string; email: string }) {
    if (!channel) {
        console.error('RabbitMQ channel is not ready');
        return;
    }
    
    const message = {
        event: 'USER_CREATED',
        data: user,
    };
    
    channel.sendToQueue('user_events', Buffer.from(JSON.stringify(message)), {
        persistent: true,
    });
    
    console.log(`📤 Event USER_CREATED sent for user: ${user.username}`);
}