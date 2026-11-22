import amqplib from 'amqplib';

const RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqp://localhost:5672';

interface UserRegisteredPayload {
    user_id: number;
    email: string;
    name: string;
}

interface ReservationPayload {
    reservation_id: number;
    user_id: number;
    restaurant_id: number;
    table_id: number;
    start_time: string;
    end_time: string;
}

interface RestaurantStatusPayload {
    restaurant_id: number;
    status: string;
}

async function connectWithRetry(retries = 10, delay = 3000): Promise<amqplib.ChannelModel> {
    for (let i = 0; i < retries; i++) {
        try {
            return await amqplib.connect(RABBITMQ_URL);
        } catch {
            console.log(`RabbitMQ not ready, retrying in ${delay}ms... (${i + 1}/${retries})`);
            await new Promise((res) => setTimeout(res, delay));
        }
    }
    throw new Error('Could not connect to RabbitMQ after retries');
}

export async function startNotificationConsumer(): Promise<void> {
    const connection = await connectWithRetry();
    const channel = await connection.createChannel();

    const exchanges = [
        { name: 'auth', type: 'topic' },
        { name: 'reservations', type: 'topic' },
        { name: 'restaurants', type: 'topic' },
    ];

    for (const ex of exchanges) {
        await channel.assertExchange(ex.name, ex.type, { durable: true });
    }

    const { queue } = await channel.assertQueue('notification-service', { durable: true });

    await channel.bindQueue(queue, 'auth', 'user.registered');
    await channel.bindQueue(queue, 'reservations', 'reservation.created');
    await channel.bindQueue(queue, 'reservations', 'reservation.cancelled');
    await channel.bindQueue(queue, 'restaurants', 'restaurant.status_changed');

    console.log('Notification consumer listening...');

    channel.consume(queue, (msg) => {
        if (!msg) return;

        const routingKey = msg.fields.routingKey;
        const payload = JSON.parse(msg.content.toString());

        switch (routingKey) {
            case 'user.registered': {
                const data = payload as UserRegisteredPayload;
                console.log(`[NOTIFICATION] Welcome email → user #${data.user_id} (${data.email}): Hello, ${data.name}!`);
                break;
            }
            case 'reservation.created': {
                const data = payload as ReservationPayload;
                console.log(`[NOTIFICATION] Reservation confirmed → user #${data.user_id}: reservation #${data.reservation_id} at restaurant #${data.restaurant_id} from ${data.start_time} to ${data.end_time}`);
                break;
            }
            case 'reservation.cancelled': {
                const data = payload as ReservationPayload;
                console.log(`[NOTIFICATION] Reservation cancelled → user #${data.user_id}: reservation #${data.reservation_id} has been cancelled`);
                break;
            }
            case 'restaurant.status_changed': {
                const data = payload as RestaurantStatusPayload;
                console.log(`[NOTIFICATION] Restaurant status update → restaurant #${data.restaurant_id} is now "${data.status}"`);
                break;
            }
            default:
                console.log(`[NOTIFICATION] Unknown event: ${routingKey}`);
        }

        channel.ack(msg);
    });
}
