package ru.itmo.restaurantbooking.lab2.catalog.adapter.rest

import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RestController
import ru.itmo.restaurantbooking.lab2.catalog.service.CatalogService
import java.time.LocalDate
import java.time.LocalDateTime

@RestController
@RequestMapping("/internal/v1/restaurants")
class InternalCatalogController(
    private val catalogService: CatalogService
) {
    @GetMapping("/{restaurantId}/summary")
    fun summary(@PathVariable restaurantId: Long) =
        catalogService.restaurantSummary(restaurantId)

    @GetMapping("/{restaurantId}/booking-context")
    fun bookingContext(
        @PathVariable restaurantId: Long,
        @RequestParam tableId: Long,
        @RequestParam guestsCount: Int,
        @RequestParam startsAt: LocalDateTime,
        @RequestParam endsAt: LocalDateTime
    ) = catalogService.bookingContext(restaurantId, tableId, guestsCount, startsAt, endsAt)

    @GetMapping("/{restaurantId}/availability-context")
    fun availabilityContext(
        @PathVariable restaurantId: Long,
        @RequestParam date: LocalDate,
        @RequestParam guestsCount: Int
    ) = catalogService.availabilityContext(restaurantId, date, guestsCount)
}
