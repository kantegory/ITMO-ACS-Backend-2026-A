import aio_pika
import json
import os
import logging
from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.models import Vacancy

RABBITMQ_URL = os.getenv("RABBITMQ_URL", "amqp://guest:guest@rabbitmq:5672/")
EXCHANGE_NAME = "job_platform"

logger = logging.getLogger(__name__)


async def handle_application_created(payload: dict):
    """
    Fired when a new application is created.
    vacancy-service decrements available slots or logs analytics.
    """
    vacancy_id = payload.get("vacancy_id")
    applicant_id = payload.get("user_id")
    logger.info(
        f"[vacancy-service] New application received: "
        f"vacancy_id={vacancy_id}, applicant_id={applicant_id}"
    )
    # Example: mark vacancy as having recent activity
    db: Session = SessionLocal()
    try:
        vacancy = db.query(Vacancy).filter(Vacancy.id == vacancy_id).first()
        if vacancy:
            logger.info(f"[vacancy-service] Vacancy '{vacancy.title}' got a new applicant.")
    finally:
        db.close()


async def start_consumer():
    """Start consuming events from RabbitMQ. Called on app startup."""
    try:
        connection = await aio_pika.connect_robust(RABBITMQ_URL)
        channel = await connection.channel()
        await channel.set_qos(prefetch_count=10)

        exchange = await channel.declare_exchange(
            EXCHANGE_NAME, aio_pika.ExchangeType.TOPIC, durable=True
        )

        # Queue for this service
        queue = await channel.declare_queue(
            "vacancy_service_queue", durable=True
        )
        await queue.bind(exchange, routing_key="application.created")

        logger.info("[vacancy-service] RabbitMQ consumer started, waiting for events...")

        async def on_message(message: aio_pika.abc.AbstractIncomingMessage):
            async with message.process():
                try:
                    payload = json.loads(message.body.decode())
                    routing_key = message.routing_key

                    if routing_key == "application.created":
                        await handle_application_created(payload)
                    else:
                        logger.warning(f"[vacancy-service] Unknown routing key: {routing_key}")
                except Exception as e:
                    logger.error(f"[vacancy-service] Error processing message: {e}")

        await queue.consume(on_message)
    except Exception as e:
        logger.error(f"[vacancy-service] Failed to start consumer: {e}")
