import aio_pika
import json
import os
import logging

RABBITMQ_URL = os.getenv("RABBITMQ_URL", "amqp://guest:guest@rabbitmq:5672/")

logger = logging.getLogger(__name__)


async def get_connection() -> aio_pika.abc.AbstractRobustConnection:
    return await aio_pika.connect_robust(RABBITMQ_URL)


async def publish_event(exchange_name: str, routing_key: str, payload: dict):
    """
    Publishes a JSON event to the given exchange with the given routing_key.
    Uses topic exchange so consumers can bind with patterns.
    """
    try:
        connection = await get_connection()
        async with connection:
            channel = await connection.channel()
            exchange = await channel.declare_exchange(
                exchange_name,
                aio_pika.ExchangeType.TOPIC,
                durable=True,
            )
            message = aio_pika.Message(
                body=json.dumps(payload).encode(),
                content_type="application/json",
                delivery_mode=aio_pika.DeliveryMode.PERSISTENT,
            )
            await exchange.publish(message, routing_key=routing_key)
            logger.info(f"Published event [{routing_key}] to [{exchange_name}]: {payload}")
    except Exception as e:
        # Non-critical: log and continue — don't fail the main request
        logger.error(f"Failed to publish event [{routing_key}]: {e}")
