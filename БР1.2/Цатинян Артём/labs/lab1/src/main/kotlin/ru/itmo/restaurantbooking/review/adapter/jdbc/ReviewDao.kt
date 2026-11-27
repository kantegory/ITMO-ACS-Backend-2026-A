package ru.itmo.restaurantbooking.review.adapter.jdbc

import org.jooq.Configuration
import org.jooq.DSLContext
import org.springframework.stereotype.Component
import ru.itmo.restaurantbooking.common.domain.PageResult
import ru.itmo.restaurantbooking.common.domain.SortDirection
import ru.itmo.restaurantbooking.common.domain.safeOffset
import ru.itmo.restaurantbooking.jooq.tables.Reviews.REVIEWS
import ru.itmo.restaurantbooking.jooq.tables.daos.ReviewsDao as JooqReviewsDao
import ru.itmo.restaurantbooking.jooq.tables.pojos.Reviews
import ru.itmo.restaurantbooking.review.service.ReviewSearchQuery

@Component
class ReviewDao(
    configuration: Configuration,
    private val dsl: DSLContext
) : JooqReviewsDao(configuration) {
    fun insertReturning(review: Reviews): Reviews =
        dsl.insertInto(REVIEWS)
            .set(dsl.newRecord(REVIEWS, review))
            .returning()
            .fetchOneInto(Reviews::class.java)
            ?: error("Failed to insert review")

    fun existsByBookingId(
        bookingId: Long
    ) =
        dsl.fetchExists(
            dsl.selectOne()
                .from(REVIEWS)
                .where(REVIEWS.BOOKING_ID.eq(bookingId))
        )

    fun findByRestaurantId(
        restaurantId: Long,
        query: ReviewSearchQuery
    ): PageResult<Reviews> {
        val items = dsl.selectFrom(REVIEWS)
            .where(REVIEWS.RESTAURANT_ID.eq(restaurantId))
            .orderBy(REVIEWS.CREATED_AT.sort(query.sortDirection.toSortOrder()))
            .limit(query.size)
            .offset(safeOffset(query.page, query.size))
            .fetchInto(Reviews::class.java)

        val total = dsl.selectCount()
            .from(REVIEWS)
            .where(REVIEWS.RESTAURANT_ID.eq(restaurantId))
            .fetchOne(0, Long::class.java)
            ?: 0L

        return PageResult(items, total)
    }

    private fun SortDirection.toSortOrder() =
        when (this) {
            SortDirection.ASC -> org.jooq.SortOrder.ASC
            SortDirection.DESC -> org.jooq.SortOrder.DESC
        }
}
