package ru.itmo.restaurantbooking.lab2.review.adapter.client.booking

import org.springframework.stereotype.Component
import org.springframework.web.client.RestClient
import ru.itmo.restaurantbooking.lab2.review.adapter.client.booking.dto.BookingReviewContext
import ru.itmo.restaurantbooking.lab2.review.config.ServiceUrls

@Component
class BookingClient(
    serviceUrls: ServiceUrls
) {
    private val restClient = RestClient.builder()
        .baseUrl(serviceUrls.bookingBaseUrl)
        .build()

    fun reviewContext(
        bookingId: Long,
        userId: Long,
        restaurantId: Long
    ): BookingReviewContext =
        restClient.get()
            .uri {
                it.path("/internal/v1/bookings/{bookingId}/review-context")
                    .queryParam("userId", userId)
                    .queryParam("restaurantId", restaurantId)
                    .build(bookingId)
            }
            .retrieve()
            .body(BookingReviewContext::class.java)
            ?: error("Booking service returned empty review context")
}
