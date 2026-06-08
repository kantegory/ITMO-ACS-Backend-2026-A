import amqp from 'amqplib';

let connection: amqp.ChannelModel | null = null;
let channel: amqp.Channel | null = null;

export async function getConnection(): Promise<amqp.ChannelModel> {
  if (!connection) {
    const url = process.env.RABBITMQ_URL || 'amqp://localhost:5672';
    connection = await amqp.connect(url);
    console.log(' RabbitMQ connected');
  }
  return connection;
}

export async function getChannel(): Promise<amqp.Channel> {
  if (!channel) {
    const conn = await getConnection();
    channel = await conn.createChannel();
    console.log(' RabbitMQ channel created');
  }
  return channel;
}

export async function closeConnection(): Promise<void> {
  if (channel) {
    await channel.close();
    channel = null;
  }
  if (connection) {
    await connection.close();
    connection = null;
  }
  console.log('🔌 RabbitMQ connection closed');
}