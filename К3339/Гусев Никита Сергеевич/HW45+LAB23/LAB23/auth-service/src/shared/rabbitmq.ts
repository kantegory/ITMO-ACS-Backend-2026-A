import amqp, { ConfirmChannel } from "amqplib"
import { HttpError } from "../../../shared/http"
import { RABBIT_URL } from "../../../shared/config"

let channelPromise: Promise<ConfirmChannel> | undefined

async function connectRabbitMq() {

    const connection = await amqp.connect(RABBIT_URL, { timeout: 3000 })

    connection.on("error", error => {
        console.warn("RabbitMQ:", error.message)
    })

    connection.on("close", () => {
        channelPromise = undefined
    })

    try {
        const channel = await connection.createConfirmChannel()

        channel.on("error", error => {
            console.warn("RabbitMQ channel:", error.message)
        })

        channel.on("close", () => {
            channelPromise = undefined
        })

        await channel.assertQueue("user_events", { durable: true })

        return channel
    } catch (error) {
        await connection.close().catch(() => {})
        throw error
    }
}

export async function getChannel() {

    if (!channelPromise) {
        channelPromise = connectRabbitMq().catch(() => {
            channelPromise = undefined
            throw new HttpError(503, "Message broker unavailable")
        })
    }

    return channelPromise
}
