package ru.itmo.restaurantbooking.lab2.booking.adapter.rest

import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RestController
import ru.itmo.restaurantbooking.lab2.booking.service.BookingService

@RestController
@RequestMapping("/internal/v1/bookings")
class InternalBookingController(
    private val bookingService: BookingService
) {
    @GetMapping("/{bookingId}/review-context")
    fun reviewContext(
        @PathVariable bookingId: Long,
        @RequestParam userId: Long,
        @RequestParam restaurantId: Long
    ) = bookingService.reviewContext(bookingId, userId, restaurantId)
}
