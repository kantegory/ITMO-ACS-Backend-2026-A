package ru.itmo.restaurantbooking.review.adapter.rest

import io.swagger.v3.oas.annotations.security.SecurityRequirement
import jakarta.validation.Valid
import org.springdoc.core.annotations.ParameterObject
import org.springframework.security.core.Authentication
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.ModelAttribute
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RestController
import ru.itmo.restaurantbooking.auth.domain.AuthenticatedUser
import ru.itmo.restaurantbooking.common.adapter.rest.config.OpenApiConfig
import ru.itmo.restaurantbooking.review.adapter.rest.dto.CreateReviewRequest
import ru.itmo.restaurantbooking.review.adapter.rest.dto.ReviewSearchRequest
import ru.itmo.restaurantbooking.review.adapter.rest.mapper.ReviewMapper
import ru.itmo.restaurantbooking.review.service.ReviewService

@RestController
@RequestMapping("/api/v1/restaurants/{restaurantId}/reviews")
class ReviewController(
    private val reviewService: ReviewService,
    private val reviewMapper: ReviewMapper
) {
    @GetMapping
    fun list(
        @PathVariable restaurantId: Long,
        @ParameterObject @Valid @ModelAttribute request: ReviewSearchRequest
    ) =
        reviewService.list(
            restaurantId = restaurantId,
            query = reviewMapper.toSearchQuery(request)
        )

    @PostMapping
    @SecurityRequirement(name = OpenApiConfig.BEARER_AUTH)
    fun create(
        authentication: Authentication,
        @PathVariable restaurantId: Long,
        @RequestParam bookingId: Long,
        @Valid @RequestBody request: CreateReviewRequest
    ) =
        reviewService.create(
            userId = authentication.userId(),
            restaurantId = restaurantId,
            bookingId = bookingId,
            request = request
        )

    private fun Authentication.userId() =
        (principal as AuthenticatedUser).id
}
