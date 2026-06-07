import aio_pika
import json
import os
import logging
from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.models import Resume

RABBITMQ_URL = os.getenv("RABBITMQ_URL", "amqp://guest:guest@rabbitmq:5672/")
EXCHANGE_NAME = "job_platform"

logger = logging.getLogger(__name__)


async def handle_application_created(payload: dict):
    """
    Fired when a new application is created.
    resume-service can mark the resume as actively used.
    """
    resume_id = payload.get("resume_id")
    vacancy_id = payload.get("vacancy_id")
    logger.info(
        f"[resume-service] Resume {resume_id} was used in application "
        f"for vacancy {vacancy_id}"
    )
    db: Session = SessionLocal()
    try:
        resume = db.query(Resume).filter(Resume.id == resume_id).first()
        if resume:
            logger.info(f"[resume-service] Resume '{resume.title}' submitted to vacancy {vacancy_id}.")
    finally:
        db.close()


async def handle_application_status_changed(payload: dict):
    """
    Fired when employer changes application status (invited/rejected/viewed).
    resume-service logs the outcome for the applicant's history.
    """
    resume_id = payload.get("resume_id")
    new_status = payload.get("status")
    vacancy_id = payload.get("vacancy_id")
    logger.info(
        f"[resume-service] Application status changed: "
        f"resume_id={resume_id}, vacancy_id={vacancy_id}, new_status={new_status}"
    )


async def start_consumer():
    """Start consuming events from RabbitMQ. Called on app startup."""
    try:
        connection = await aio_pika.connect_robust(RABBITMQ_URL)
        channel = await connection.channel()
        await channel.set_qos(prefetch_count=10)

        exchange = await channel.declare_exchange(
            EXCHANGE_NAME, aio_pika.ExchangeType.TOPIC, durable=True
        )

        queue = await channel.declare_queue(
            "resume_service_queue", durable=True
        )
        await queue.bind(exchange, routing_key="application.created")
        await queue.bind(exchange, routing_key="application.status_changed")

        logger.info("[resume-service] RabbitMQ consumer started, waiting for events...")

        async def on_message(message: aio_pika.abc.AbstractIncomingMessage):
            async with message.process():
                try:
                    payload = json.loads(message.body.decode())
                    routing_key = message.routing_key

                    if routing_key == "application.created":
                        await handle_application_created(payload)
                    elif routing_key == "application.status_changed":
                        await handle_application_status_changed(payload)
                    else:
                        logger.warning(f"[resume-service] Unknown routing key: {routing_key}")
                except Exception as e:
                    logger.error(f"[resume-service] Error processing message: {e}")

        await queue.consume(on_message)
    except Exception as e:
        logger.error(f"[resume-service] Failed to start consumer: {e}")
