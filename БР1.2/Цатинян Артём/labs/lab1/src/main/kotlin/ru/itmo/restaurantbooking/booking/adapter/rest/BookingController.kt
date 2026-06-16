package ru.itmo.restaurantbooking.booking.adapter.rest

import io.swagger.v3.oas.annotations.security.SecurityRequirement
import jakarta.validation.Valid
import org.springdoc.core.annotations.ParameterObject
import org.springframework.security.core.Authentication
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.ModelAttribute
import org.springframework.web.bind.annotation.PatchMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController
import ru.itmo.restaurantbooking.auth.domain.AuthenticatedUser
import ru.itmo.restaurantbooking.booking.adapter.rest.dto.BookingSearchRequest
import ru.itmo.restaurantbooking.booking.adapter.rest.dto.CreateBookingRequest
import ru.itmo.restaurantbooking.booking.adapter.rest.mapper.BookingMapper
import ru.itmo.restaurantbooking.common.adapter.rest.config.OpenApiConfig
import ru.itmo.restaurantbooking.booking.service.BookingService

@RestController
@RequestMapping("/api/v1/bookings")
@SecurityRequirement(name = OpenApiConfig.BEARER_AUTH)
class BookingController(
    private val bookingService: BookingService,
    private val bookingMapper: BookingMapper
) {
    @PostMapping
    fun create(
        authentication: Authentication,
        @Valid @RequestBody request: CreateBookingRequest
    ) = bookingService.create(
            userId = authentication.userId(),
            request = request
        )

    @GetMapping("/me")
    fun getMine(
        authentication: Authentication,
        @ParameterObject @Valid @ModelAttribute request: BookingSearchRequest
    ) = bookingService.getMine(
            userId = authentication.userId(),
            query = bookingMapper.toSearchQuery(request)
        )

    @GetMapping("/{bookingId}")
    fun getById(
        authentication: Authentication,
        @PathVariable bookingId: Long
    ) = bookingService.getById(
            userId = authentication.userId(),
            bookingId = bookingId
        )

    @PatchMapping("/{bookingId}/cancel")
    fun cancel(
        authentication: Authentication,
        @PathVariable bookingId: Long
    ) = bookingService.cancel(
            userId = authentication.userId(),
            bookingId = bookingId
        )

    private fun Authentication.userId() = (principal as AuthenticatedUser).id
}
