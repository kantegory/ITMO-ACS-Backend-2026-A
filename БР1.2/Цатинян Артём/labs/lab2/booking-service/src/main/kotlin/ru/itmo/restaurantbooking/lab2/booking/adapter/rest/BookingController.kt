package ru.itmo.restaurantbooking.lab2.booking.adapter.rest

import jakarta.validation.Valid
import jakarta.validation.constraints.Max
import jakarta.validation.constraints.Min
import org.springframework.http.HttpStatus
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PatchMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestHeader
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.ResponseStatus
import org.springframework.web.bind.annotation.RestController
import ru.itmo.restaurantbooking.lab2.booking.adapter.rest.dto.CreateBookingRequest
import ru.itmo.restaurantbooking.lab2.booking.service.BookingService
import java.time.LocalDate

@RestController
@RequestMapping("/api/v1")
class BookingController(
    private val bookingService: BookingService
) {
    @GetMapping("/restaurants/{restaurantId}/availability")
    fun availability(
        @PathVariable restaurantId: Long,
        @RequestParam date: LocalDate,
        @RequestParam(defaultValue = "2") @Min(1) @Max(20) guestsCount: Int
    ) = bookingService.availability(restaurantId, date, guestsCount)

    @PostMapping("/bookings")
    @ResponseStatus(HttpStatus.CREATED)
    fun create(
        @RequestHeader("X-User-Id") userId: Long,
        @Valid @RequestBody request: CreateBookingRequest
    ) = bookingService.create(userId, request)

    @GetMapping("/bookings/me")
    fun mine(
        @RequestHeader("X-User-Id") userId: Long,
        @RequestParam(defaultValue = "1") page: Int,
        @RequestParam(defaultValue = "10") size: Int
    ) = bookingService.mine(userId, page.coerceAtLeast(1), size.coerceIn(1, 100))

    @GetMapping("/bookings/{bookingId}")
    fun byId(
        @RequestHeader("X-User-Id") userId: Long,
        @PathVariable bookingId: Long
    ) = bookingService.byId(userId, bookingId)

    @PatchMapping("/bookings/{bookingId}/cancel")
    fun cancel(
        @RequestHeader("X-User-Id") userId: Long,
        @PathVariable bookingId: Long
    ) = bookingService.cancel(userId, bookingId)
}
