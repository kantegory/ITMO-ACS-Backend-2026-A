package ru.itmo.restaurantbooking.lab2.booking.adapter.client.catalog

import org.springframework.stereotype.Component
import org.springframework.web.client.RestClient
import ru.itmo.restaurantbooking.lab2.booking.adapter.client.catalog.dto.AvailabilityContextResponse
import ru.itmo.restaurantbooking.lab2.booking.adapter.client.catalog.dto.RestaurantBookingContext
import ru.itmo.restaurantbooking.lab2.booking.config.ServiceUrls
import java.time.LocalDate
import java.time.LocalDateTime

@Component
class CatalogClient(
    serviceUrls: ServiceUrls
) {
    private val restClient = RestClient.builder()
        .baseUrl(serviceUrls.catalogBaseUrl)
        .build()

    fun bookingContext(
        restaurantId: Long,
        tableId: Long,
        guestsCount: Int,
        startsAt: LocalDateTime,
        endsAt: LocalDateTime
    ): RestaurantBookingContext =
        restClient.get()
            .uri {
                it.path("/internal/v1/restaurants/{restaurantId}/booking-context")
                    .queryParam("tableId", tableId)
                    .queryParam("guestsCount", guestsCount)
                    .queryParam("startsAt", startsAt)
                    .queryParam("endsAt", endsAt)
                    .build(restaurantId)
            }
            .retrieve()
            .body(RestaurantBookingContext::class.java)
            ?: error("Catalog service returned empty booking context")

    fun availabilityContext(
        restaurantId: Long,
        date: LocalDate,
        guestsCount: Int
    ): AvailabilityContextResponse =
        restClient.get()
            .uri {
                it.path("/internal/v1/restaurants/{restaurantId}/availability-context")
                    .queryParam("date", date)
                    .queryParam("guestsCount", guestsCount)
                    .build(restaurantId)
            }
            .retrieve()
            .body(AvailabilityContextResponse::class.java)
            ?: error("Catalog service returned empty availability context")
}
