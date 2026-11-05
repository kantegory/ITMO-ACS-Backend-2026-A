import amqp from "amqplib"
import { RABBIT_URL } from "../../../shared/config"

export async function getConnection() {

    const connection = await amqp.connect(RABBIT_URL, { timeout: 3000 })

    connection.on("error", error => {
        console.warn("RabbitMQ:", error.message)
    })

    return connection
}
