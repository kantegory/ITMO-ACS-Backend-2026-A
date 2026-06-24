import amqp from "amqplib"

export async function getChannel() {
    const connection = await amqp.connect("amqp://rabbitmq:5672")
    const channel = await connection.createChannel()

    await channel.assertQueue("user_events")

    return channel
}