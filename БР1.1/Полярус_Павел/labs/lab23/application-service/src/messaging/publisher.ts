import amqp from 'amqplib';

let channel: amqp.Channel;

export async function connectRabbitMQ(): Promise<void> {
    try {
        const conn = await amqp.connect(process.env.RABBITMQ_URL!);
        channel = await conn.createChannel();
        await channel.assertExchange('jobby', 'topic', { durable: true });
        console.log("Rabbit connected");
    } catch (err) {
        console.error("Rabbit connection failed", err);
        throw err;

    }
}

export function publish(routingKey: string, payload: object): void {
    if (!channel) {
        console.error("Rabbit channel not initialized");
        return;
    }

    channel.publish(
        'jobby',
        routingKey,
        Buffer.from(JSON.stringify(payload)),
        { persistent: true }
    );

    console.log(`Published to ${routingKey}:`, payload);
}

export function publishApplicationCreated(
    applicationId: string,
    vacancyId: string,
    resumeId: string,
    seekerUserId: string,
    employerUserId: string
    ): void {
        publish('application.created', {
        event: 'application.created',
        applicationId,
        vacancyId,
        resumeId,
        seekerUserId,
        employerUserId,
        createdAt: new Date().toISOString(),
    });
}

export function publishApplicationStatusChanged(
    applicationId: string,
    newStatus: string,
    seekerUserId: string
    ): void {
    publish('application.status_changed', {
        event: 'application.status_changed',
        applicationId,
        newStatus,
        seekerUserId,
        updatedAt: new Date().toISOString(),
    });
}