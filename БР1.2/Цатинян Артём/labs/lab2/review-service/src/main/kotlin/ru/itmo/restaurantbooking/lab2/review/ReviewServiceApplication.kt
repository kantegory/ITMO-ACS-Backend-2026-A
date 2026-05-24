package ru.itmo.restaurantbooking.lab2.review

import jakarta.validation.Valid
import jakarta.validation.constraints.Max
import jakarta.validation.constraints.Min
import org.springframework.boot.autoconfigure.SpringBootApplication
import org.springframework.boot.context.properties.ConfigurationProperties
import org.springframework.boot.context.properties.EnableConfigurationProperties
import org.springframework.boot.runApplication
import org.springframework.http.HttpStatus
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate
import org.springframework.stereotype.Component
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestHeader
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.ResponseStatus
import org.springframework.web.bind.annotation.RestController
import org.springframework.web.client.RestClient
import ru.itmo.restaurantbooking.lab2.common.dto.PageResponse
import ru.itmo.restaurantbooking.lab2.common.exception.ConflictException
import ru.itmo.restaurantbooking.lab2.common.exception.UnprocessableEntityException
import java.time.LocalDateTime

@SpringBootApplication(scanBasePackages = ["ru.itmo.restaurantbooking.lab2"])
@EnableConfigurationProperties(ServiceUrls::class)
class ReviewServiceApplication

fun main(args: Array<String>) {
    runApplication<ReviewServiceApplication>(*args)
}

@ConfigurationProperties(prefix = "services")
data class ServiceUrls(
    val bookingBaseUrl: String
)

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

@Component
class ReviewService(
    private val reviewRepository: ReviewRepository,
    private val bookingClient: BookingClient
) {
    fun list(
        restaurantId: Long,
        page: Int,
        size: Int
    ): PageResponse<ReviewResponse> {
        val result = reviewRepository.findByRestaurant(restaurantId, page, size)
        return PageResponse(
            items = result.items.map { it.toResponse() },
            page = page,
            size = size,
            totalItems = result.totalItems,
            totalPages = if (result.totalItems == 0L) 0 else ((result.totalItems + size - 1) / size).toInt()
        )
    }

    fun create(
        userId: Long,
        restaurantId: Long,
        request: CreateReviewRequest
    ): ReviewResponse {
        val context = bookingClient.reviewContext(
            bookingId = request.bookingId,
            userId = userId,
            restaurantId = restaurantId
        )

        if (!context.canReview) {
            throw UnprocessableEntityException(context.denialReason ?: "Booking cannot be reviewed")
        }

        if (reviewRepository.existsByBookingId(request.bookingId)) {
            throw ConflictException("A review for this booking already exists")
        }

        return reviewRepository.create(
            userId = userId,
            restaurantId = restaurantId,
            request = request,
            authorNameSnapshot = "User $userId"
        ).toResponse()
    }
}

@Component
class BookingClient(
    serviceUrls: ServiceUrls
) {
    private val restClient = RestClient.builder()
        .baseUrl(serviceUrls.bookingBaseUrl)
        .build()

    fun reviewContext(
        bookingId: Long,
        userId: Long,
        restaurantId: Long
    ): BookingReviewContext =
        restClient.get()
            .uri {
                it.path("/internal/v1/bookings/{bookingId}/review-context")
                    .queryParam("userId", userId)
                    .queryParam("restaurantId", restaurantId)
                    .build(bookingId)
            }
            .retrieve()
            .body(BookingReviewContext::class.java)
            ?: error("Booking service returned empty review context")
}

@Component
class ReviewRepository(
    private val jdbc: NamedParameterJdbcTemplate
) {
    fun findByRestaurant(
        restaurantId: Long,
        page: Int,
        size: Int
    ): PageResult<ReviewRecord> {
        val params = mapOf(
            "restaurantId" to restaurantId,
            "limit" to size,
            "offset" to (page - 1) * size
        )
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
        jdbc.query(
            "select * from reviews where id = :id",
            mapOf("id" to id)
        ) { rs, _ -> rs.toReviewRecord() }.firstOrNull()
}

data class CreateReviewRequest(
    val bookingId: Long,
    @field:Min(1)
    @field:Max(5)
    val rating: Int,
    val comment: String?
)

data class ReviewResponse(
    val id: Long,
    val bookingId: Long,
    val rating: Int,
    val comment: String?,
    val authorName: String,
    val createdAt: LocalDateTime
)

data class BookingReviewContext(
    val bookingId: Long,
    val userId: Long,
    val restaurantId: Long,
    val status: String,
    val startsAt: LocalDateTime,
    val endsAt: LocalDateTime,
    val canReview: Boolean,
    val denialReason: String?
)

data class ReviewRecord(
    val id: Long,
    val bookingId: Long,
    val restaurantId: Long,
    val userId: Long,
    val rating: Int,
    val comment: String?,
    val authorNameSnapshot: String,
    val createdAt: LocalDateTime
)

data class PageResult<T>(
    val items: List<T>,
    val totalItems: Long
)

private fun ReviewRecord.toResponse() =
    ReviewResponse(
        id = id,
        bookingId = bookingId,
        rating = rating,
        comment = comment,
        authorName = authorNameSnapshot,
        createdAt = createdAt
    )

private fun java.sql.ResultSet.toReviewRecord() =
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
