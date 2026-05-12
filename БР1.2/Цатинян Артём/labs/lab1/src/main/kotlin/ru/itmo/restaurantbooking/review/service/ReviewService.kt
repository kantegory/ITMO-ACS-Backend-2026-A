package ru.itmo.restaurantbooking.review.service

import org.springframework.stereotype.Service
import ru.itmo.restaurantbooking.booking.domain.BookingStatus
import ru.itmo.restaurantbooking.booking.service.BookingService
import ru.itmo.restaurantbooking.common.adapter.rest.dto.PageResponse
import ru.itmo.restaurantbooking.common.exception.BadRequestException
import ru.itmo.restaurantbooking.common.exception.ConflictException
import ru.itmo.restaurantbooking.jooq.tables.pojos.Reviews
import ru.itmo.restaurantbooking.review.adapter.jdbc.ReviewDao
import ru.itmo.restaurantbooking.review.adapter.rest.dto.CreateReviewRequest
import ru.itmo.restaurantbooking.review.adapter.rest.dto.ReviewResponse
import ru.itmo.restaurantbooking.review.adapter.rest.mapper.ReviewMapper
import java.time.LocalDateTime

@Service
class ReviewService(
    private val reviewDao: ReviewDao,
    private val bookingService: BookingService,
    private val reviewMapper: ReviewMapper
) {
    fun list(
        restaurantId: Long,
        query: ReviewSearchQuery
    ): PageResponse<ReviewResponse> {
        val result = reviewDao.findByRestaurantId(
            restaurantId = restaurantId,
            query = query
        )

        return PageResponse(
            items = result.items.map(reviewMapper::toResponse),
            page = query.page,
            size = query.size,
            totalItems = result.totalItems,
            totalPages = result.totalPages(query.size)
        )
    }

    fun create(
        userId: Long,
        restaurantId: Long,
        bookingId: Long,
        request: CreateReviewRequest
    ) = reviewMapper.toResponse(
        createReview(
            userId = userId,
            restaurantId = restaurantId,
            bookingId = bookingId,
            request = request
        )
    )

    private fun createReview(
        userId: Long,
        restaurantId: Long,
        bookingId: Long,
        request: CreateReviewRequest
    ): Reviews {
        val booking = bookingService.requireUserBooking(userId, bookingId)
        val now = LocalDateTime.now()

        if (booking.restaurantId != restaurantId) {
            throw BadRequestException("Booking does not belong to the selected restaurant")
        }

        if (booking.status != BookingStatus.COMPLETED || booking.endsAt.isAfter(now)) {
            throw BadRequestException("A review can only be created after the booking is completed")
        }

        if (reviewDao.existsByBookingId(bookingId)) {
            throw ConflictException("A review for this booking already exists")
        }

        val review = Reviews()
            .setBookingId(booking.id)
            .setRestaurantId(restaurantId)
            .setUserId(userId)
            .setRating(request.rating)
            .setComment(request.comment)
            .setCreatedAt(now)

        return reviewDao.insertReturning(review)
    }
}
