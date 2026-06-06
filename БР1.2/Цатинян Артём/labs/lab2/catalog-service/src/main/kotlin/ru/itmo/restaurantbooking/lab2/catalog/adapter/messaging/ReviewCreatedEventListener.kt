package ru.itmo.restaurantbooking.lab2.catalog.adapter.messaging

import org.slf4j.LoggerFactory
import org.springframework.amqp.rabbit.annotation.RabbitListener
import org.springframework.stereotype.Component
import ru.itmo.restaurantbooking.lab2.catalog.adapter.jooq.CatalogRepository
import ru.itmo.restaurantbooking.lab2.common.messaging.ReviewCreatedEvent
import ru.itmo.restaurantbooking.lab2.common.messaging.ReviewEvents

@Component
class ReviewCreatedEventListener(
    private val catalogRepository: CatalogRepository
) {
    private val log = LoggerFactory.getLogger(javaClass)

    @RabbitListener(queues = [ReviewEvents.CREATED_QUEUE])
    fun handle(event: ReviewCreatedEvent) {
        val applied = catalogRepository.applyReviewCreatedEvent(
            eventId = event.eventId,
            reviewId = event.reviewId,
            restaurantId = event.restaurantId,
            rating = event.rating
        )

        if (applied) {
            log.info("Applied ReviewCreated event {} to restaurant {}", event.eventId, event.restaurantId)
        } else {
            log.info("Skipped already processed ReviewCreated event {}", event.eventId)
        }
    }
}
