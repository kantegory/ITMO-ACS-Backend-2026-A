import { ChannelModel } from "amqplib"
import { getConnection } from "./rabbitmq"

export async function startUserConsumer() {

    let connection: ChannelModel | undefined

    try {
        connection = await getConnection()

        connection.once("close", () => {
            setTimeout(startUserConsumer, 2000)
        })

        const channel = await connection.createChannel()

        channel.on("error", error => {
            console.warn("RabbitMQ channel:", error.message)
        })

        await channel.assertQueue("user_events", { durable: true })

        await channel.consume("user_events", message => {
            if (!message) {
                return
            }

            try {
                const event = JSON.parse(message.content.toString())

                if (event.type === "USER_REGISTERED") {
                    console.log("User registered:", event.payload.id)
                }

                channel.ack(message)
            } catch {
                channel.nack(message, false, false)
            }
        })

        console.log("User event consumer connected")
    } catch (error) {
        console.warn("RabbitMQ not ready:", error.message)

        if (connection) {
            await connection.close().catch(() => {})
        } else {
            setTimeout(startUserConsumer, 2000)
        }
    }
}
