import amqp from "amqplib"

export const RABBIT_URL = "amqp://rabbitmq:5672"

export async function getChannel() {
    const connection = await amqp.connect(RABBIT_URL)
    const channel = await connection.createChannel()

    await channel.assertQueue("user_events", {
        durable: true
    })

    return channel
}