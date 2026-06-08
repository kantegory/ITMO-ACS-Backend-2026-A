import amqp, { Connection, Channel } from 'amqplib';

class RabbitMQService {
    private connection!: Connection;
    private channel!: Channel;

    async connect() {
        const rabbitUrl = process.env.RABBITMQ_URL || 'amqp://localhost:5672';
        let retries = 5;

        while (retries) {
            try {
                this.connection = await amqp.connect(rabbitUrl);
                this.channel = await this.connection.createChannel();
                await this.channel.assertExchange('user_events', 'fanout', {
                    durable: true,
                });
                console.log('✅ Успешно подключено к RabbitMQ');
                break;
            } catch (error) {
                console.error(
                    `❌ Ошибка подключения к RabbitMQ. Осталось попыток: ${retries - 1}`,
                );
                retries -= 1;
                await new Promise((res) => setTimeout(res, 5000));
            }
        }
    }

    async publish(exchange: string, routingKey: string, message: any) {
        if (!this.channel) await this.connect();
        this.channel.publish(
            exchange,
            routingKey,
            Buffer.from(JSON.stringify(message)),
        );
        console.log(
            `📤 Опубликовано событие ${routingKey} в обменник ${exchange}`,
        );
    }

    async consume(
        exchange: string,
        queueName: string,
        callback: (msg: any) => void,
    ) {
        if (!this.channel) await this.connect();
        await this.channel.assertQueue(queueName, { durable: true });
        await this.channel.bindQueue(queueName, exchange, '');

        this.channel.consume(queueName, (msg) => {
            if (msg !== null) {
                const content = JSON.parse(msg.content.toString());
                callback(content);
                this.channel.ack(msg);
            }
        });
        console.log(`📥 Ожидание сообщений в очереди ${queueName}...`);
    }
}

export default new RabbitMQService();
