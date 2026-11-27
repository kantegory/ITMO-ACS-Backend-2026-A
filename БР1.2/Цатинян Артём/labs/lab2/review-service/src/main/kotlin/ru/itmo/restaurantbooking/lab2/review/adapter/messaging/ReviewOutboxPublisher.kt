package ru.itmo.restaurantbooking.lab2.review.adapter.messaging

import com.fasterxml.jackson.databind.ObjectMapper
import org.slf4j.LoggerFactory
import org.springframework.amqp.rabbit.core.RabbitTemplate
import org.springframework.scheduling.annotation.Scheduled
import org.springframework.stereotype.Component
import ru.itmo.restaurantbooking.lab2.common.messaging.ReviewCreatedEvent
import ru.itmo.restaurantbooking.lab2.common.messaging.ReviewEvents
import ru.itmo.restaurantbooking.lab2.review.adapter.jooq.ReviewRepository

@Component
class ReviewOutboxPublisher(
    private val reviewRepository: ReviewRepository,
    private val rabbitTemplate: RabbitTemplate,
    private val objectMapper: ObjectMapper
) {
    private val log = LoggerFactory.getLogger(javaClass)

    @Scheduled(fixedDelayString = "\${messaging.review-events.publish-delay-ms:3000}")
    fun publishPending() {
        reviewRepository.findPendingOutbox(limit = 20).forEach { outbox ->
            try {
                val payload = objectMapper.readValue(outbox.payload, ReviewCreatedPayload::class.java)
                val event = ReviewCreatedEvent(
                    eventId = outbox.id.toString(),
                    reviewId = payload.reviewId,
                    bookingId = payload.bookingId,
                    restaurantId = payload.restaurantId,
                    userId = payload.userId,
                    rating = payload.rating,
                    occurredAt = outbox.createdAt
                )

                rabbitTemplate.convertAndSend(
                    ReviewEvents.EXCHANGE,
                    ReviewEvents.CREATED_ROUTING_KEY,
                    event
                )
                reviewRepository.markOutboxProcessed(outbox.id)
                log.info("Published ReviewCreated event {} for review {}", event.eventId, event.reviewId)
            } catch (exception: Exception) {
                log.warn("Failed to publish review outbox event {}", outbox.id, exception)
            }
        }
    }
}

private data class ReviewCreatedPayload(
    val reviewId: Long,
    val bookingId: Long,
    val restaurantId: Long,
    val userId: Long,
    val rating: Int
)
