package ru.itmo.restaurantbooking.lab2.review.adapter.jdbc

import org.springframework.jdbc.core.namedparam.MapSqlParameterSource
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate
import org.springframework.stereotype.Repository
import ru.itmo.restaurantbooking.lab2.review.adapter.rest.dto.CreateReviewRequest
import ru.itmo.restaurantbooking.lab2.review.domain.PageResult
import ru.itmo.restaurantbooking.lab2.review.domain.ReviewRecord
import java.sql.ResultSet

@Repository
class ReviewRepository(
    private val jdbc: NamedParameterJdbcTemplate
) {
    fun findByRestaurant(restaurantId: Long, page: Int, size: Int): PageResult<ReviewRecord> {
        val params = mapOf("restaurantId" to restaurantId, "limit" to size, "offset" to (page - 1) * size)
        val items = jdbc.query(
            """
            select *
            from reviews
            where restaurant_id = :restaurantId
            order by created_at desc
            limit :limit offset :offset
            """.trimIndent(),
            params
        ) { rs, _ -> rs.toReviewRecord() }

        val total = jdbc.queryForObject(
            "select count(*) from reviews where restaurant_id = :restaurantId",
            params,
            Long::class.java
        ) ?: 0L

        return PageResult(items, total)
    }

    fun existsByBookingId(bookingId: Long): Boolean =
        jdbc.queryForObject(
            "select exists(select 1 from reviews where booking_id = :bookingId)",
            mapOf("bookingId" to bookingId),
            Boolean::class.java
        ) ?: false

    fun create(
        userId: Long,
        restaurantId: Long,
        request: CreateReviewRequest,
        authorNameSnapshot: String
    ): ReviewRecord {
        val id = jdbc.queryForObject(
            """
            insert into reviews(booking_id, restaurant_id, user_id, rating, comment, author_name_snapshot, created_at, updated_at)
            values (:bookingId, :restaurantId, :userId, :rating, :comment, :authorNameSnapshot, now(), now())
            returning id
            """.trimIndent(),
            MapSqlParameterSource()
                .addValue("bookingId", request.bookingId)
                .addValue("restaurantId", restaurantId)
                .addValue("userId", userId)
                .addValue("rating", request.rating)
                .addValue("comment", request.comment)
                .addValue("authorNameSnapshot", authorNameSnapshot),
            Long::class.java
        ) ?: error("Failed to create review")

        jdbc.update(
            """
            insert into review_outbox(event_type, aggregate_id, payload, created_at, processed)
            values ('ReviewCreated', :reviewId, :payload, now(), false)
            """.trimIndent(),
            mapOf(
                "reviewId" to id,
                "payload" to """{"reviewId":$id,"restaurantId":$restaurantId,"userId":$userId,"rating":${request.rating}}"""
            )
        )

        return findById(id) ?: error("Created review not found")
    }

    private fun findById(id: Long): ReviewRecord? =
        jdbc.query("select * from reviews where id = :id", mapOf("id" to id)) { rs, _ ->
            rs.toReviewRecord()
        }.firstOrNull()
}

private fun ResultSet.toReviewRecord() =
    ReviewRecord(
        id = getLong("id"),
        bookingId = getLong("booking_id"),
        restaurantId = getLong("restaurant_id"),
        userId = getLong("user_id"),
        rating = getInt("rating"),
        comment = getString("comment"),
        authorNameSnapshot = getString("author_name_snapshot"),
        createdAt = getTimestamp("created_at").toLocalDateTime()
    )
