package ru.itmo.restaurantbooking.lab2.review.service

import org.springframework.stereotype.Service
import ru.itmo.restaurantbooking.lab2.common.dto.PageResponse
import ru.itmo.restaurantbooking.lab2.common.auth.AuthenticatedUser
import ru.itmo.restaurantbooking.lab2.common.exception.ConflictException
import ru.itmo.restaurantbooking.lab2.common.exception.UnprocessableEntityException
import ru.itmo.restaurantbooking.lab2.review.adapter.client.booking.BookingClient
import ru.itmo.restaurantbooking.lab2.review.adapter.jooq.ReviewRepository
import ru.itmo.restaurantbooking.lab2.review.adapter.rest.dto.CreateReviewRequest
import ru.itmo.restaurantbooking.lab2.review.adapter.rest.dto.ReviewResponse
import ru.itmo.restaurantbooking.lab2.review.adapter.rest.dto.toResponse

@Service
class ReviewService(
    private val reviewRepository: ReviewRepository,
    private val bookingClient: BookingClient
) {
    fun list(restaurantId: Long, page: Int, size: Int): PageResponse<ReviewResponse> {
        val result = reviewRepository.findByRestaurant(restaurantId, page, size)
        return PageResponse(
            items = result.items.map { it.toResponse() },
            page = page,
            size = size,
            totalItems = result.totalItems,
            totalPages = if (result.totalItems == 0L) 0 else ((result.totalItems + size - 1) / size).toInt()
        )
    }

    fun create(currentUser: AuthenticatedUser, restaurantId: Long, request: CreateReviewRequest): ReviewResponse {
        val context = bookingClient.reviewContext(
            bookingId = request.bookingId,
            userId = currentUser.id,
            restaurantId = restaurantId
        )

        if (!context.canReview) {
            throw UnprocessableEntityException(context.denialReason ?: "Booking cannot be reviewed")
        }

        if (reviewRepository.existsByBookingId(request.bookingId)) {
            throw ConflictException("A review for this booking already exists")
        }

        return reviewRepository.create(
            userId = currentUser.id,
            restaurantId = restaurantId,
            request = request,
            authorNameSnapshot = currentUser.fullName
        ).toResponse()
    }
}
