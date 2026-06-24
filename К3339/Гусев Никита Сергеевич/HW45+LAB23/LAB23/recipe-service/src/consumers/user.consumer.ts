import amqp from "amqplib"

export async function startUserConsumer() {

    const connection = await amqp.connect("amqp://rabbitmq:5672")
    const channel = await connection.createChannel()

    await channel.assertQueue("user_events")

    console.log("Consumer started: user_events")

    channel.consume("user_events", (msg) => {

        if (!msg) return

        const data = JSON.parse(msg.content.toString())

        console.log("EVENT RECEIVED:", data)

        if (data.type === "USER_REGISTERED") {
            console.log("New user detected:", data.payload.email)
        }

        channel.ack(msg)
    })
}