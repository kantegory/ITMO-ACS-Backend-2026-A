package ru.itmo.restaurantbooking.lab2.review.adapter.jooq

import org.jooq.DSLContext
import org.springframework.stereotype.Repository
import ru.itmo.restaurantbooking.lab2.review.adapter.rest.dto.CreateReviewRequest
import ru.itmo.restaurantbooking.lab2.review.domain.PageResult
import ru.itmo.restaurantbooking.lab2.review.domain.ReviewRecord
import ru.itmo.restaurantbooking.lab2.review.jooq.tables.ReviewOutbox.REVIEW_OUTBOX
import ru.itmo.restaurantbooking.lab2.review.jooq.tables.Reviews.REVIEWS
import ru.itmo.restaurantbooking.lab2.review.jooq.tables.records.ReviewsRecord
import java.time.LocalDateTime

@Repository
class ReviewRepository(
    private val dsl: DSLContext
) {
    fun findByRestaurant(restaurantId: Long, page: Int, size: Int): PageResult<ReviewRecord> {
        val items = dsl.selectFrom(REVIEWS)
            .where(REVIEWS.RESTAURANT_ID.eq(restaurantId))
            .orderBy(REVIEWS.CREATED_AT.desc())
            .limit(size)
            .offset((page - 1) * size)
            .fetch { it.toReviewRecord() }

        val total = dsl.fetchCount(REVIEWS, REVIEWS.RESTAURANT_ID.eq(restaurantId)).toLong()
        return PageResult(items, total)
    }

    fun existsByBookingId(bookingId: Long): Boolean =
        dsl.fetchExists(
            dsl.selectOne()
                .from(REVIEWS)
                .where(REVIEWS.BOOKING_ID.eq(bookingId))
        )

    fun create(
        userId: Long,
        restaurantId: Long,
        request: CreateReviewRequest,
        authorNameSnapshot: String
    ): ReviewRecord {
        val now = LocalDateTime.now()
        val id = dsl.insertInto(REVIEWS)
            .set(REVIEWS.BOOKING_ID, request.bookingId)
            .set(REVIEWS.RESTAURANT_ID, restaurantId)
            .set(REVIEWS.USER_ID, userId)
            .set(REVIEWS.RATING, request.rating)
            .set(REVIEWS.COMMENT, request.comment)
            .set(REVIEWS.AUTHOR_NAME_SNAPSHOT, authorNameSnapshot)
            .set(REVIEWS.CREATED_AT, now)
            .set(REVIEWS.UPDATED_AT, now)
            .returningResult(REVIEWS.ID)
            .fetchOne(REVIEWS.ID)
            ?: error("Failed to create review")

        dsl.insertInto(REVIEW_OUTBOX)
            .set(REVIEW_OUTBOX.EVENT_TYPE, "ReviewCreated")
            .set(REVIEW_OUTBOX.AGGREGATE_ID, id)
            .set(
                REVIEW_OUTBOX.PAYLOAD,
                """{"reviewId":$id,"restaurantId":$restaurantId,"userId":$userId,"rating":${request.rating}}"""
            )
            .set(REVIEW_OUTBOX.CREATED_AT, now)
            .set(REVIEW_OUTBOX.PROCESSED, false)
            .execute()

        return findById(id) ?: error("Created review not found")
    }

    private fun findById(id: Long): ReviewRecord? =
        dsl.selectFrom(REVIEWS)
            .where(REVIEWS.ID.eq(id))
            .fetchOne { it.toReviewRecord() }
}

private fun ReviewsRecord.toReviewRecord() =
    ReviewRecord(
        id = id,
        bookingId = bookingId,
        restaurantId = restaurantId,
        userId = userId,
        rating = rating,
        comment = comment,
        authorNameSnapshot = authorNameSnapshot,
        createdAt = createdAt
    )
