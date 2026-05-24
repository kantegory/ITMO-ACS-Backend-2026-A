package ru.itmo.restaurantbooking.lab2.review.adapter.rest

import jakarta.validation.Valid
import org.springframework.http.HttpStatus
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestHeader
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.ResponseStatus
import org.springframework.web.bind.annotation.RestController
import ru.itmo.restaurantbooking.lab2.review.adapter.rest.dto.CreateReviewRequest
import ru.itmo.restaurantbooking.lab2.review.service.ReviewService

@RestController
@RequestMapping("/api/v1/restaurants/{restaurantId}/reviews")
class ReviewController(
    private val reviewService: ReviewService
) {
    @GetMapping
    fun list(
        @PathVariable restaurantId: Long,
        @RequestParam(defaultValue = "1") page: Int,
        @RequestParam(defaultValue = "10") size: Int
    ) = reviewService.list(restaurantId, page.coerceAtLeast(1), size.coerceIn(1, 100))

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    fun create(
        @RequestHeader("X-User-Id") userId: Long,
        @PathVariable restaurantId: Long,
        @Valid @RequestBody request: CreateReviewRequest
    ) = reviewService.create(userId, restaurantId, request)
}
