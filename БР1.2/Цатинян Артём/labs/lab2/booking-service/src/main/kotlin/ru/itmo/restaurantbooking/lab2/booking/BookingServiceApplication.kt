package ru.itmo.restaurantbooking.lab2.booking

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
import org.springframework.web.bind.annotation.PatchMapping
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
import ru.itmo.restaurantbooking.lab2.common.exception.BadRequestException
import ru.itmo.restaurantbooking.lab2.common.exception.ConflictException
import ru.itmo.restaurantbooking.lab2.common.exception.NotFoundException
import ru.itmo.restaurantbooking.lab2.common.exception.UnprocessableEntityException
import java.math.BigDecimal
import java.time.LocalDate
import java.time.LocalDateTime
import java.time.LocalTime

@SpringBootApplication(scanBasePackages = ["ru.itmo.restaurantbooking.lab2"])
@EnableConfigurationProperties(ServiceUrls::class)
class BookingServiceApplication

fun main(args: Array<String>) {
    runApplication<BookingServiceApplication>(*args)
}

@ConfigurationProperties(prefix = "services")
data class ServiceUrls(
    val catalogBaseUrl: String
)

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

@RestController
@RequestMapping("/internal/v1/bookings")
class InternalBookingController(
    private val bookingRepository: BookingRepository
) {
    @GetMapping("/{bookingId}/review-context")
    fun reviewContext(
        @PathVariable bookingId: Long,
        @RequestParam userId: Long,
        @RequestParam restaurantId: Long
    ): BookingReviewContext {
        val booking = bookingRepository.findByIdAndUserId(bookingId, userId)
            ?: throw NotFoundException("Booking not found")

        if (booking.restaurantId != restaurantId) {
            throw NotFoundException("Booking not found for this restaurant")
        }

        val canReview = booking.status == "COMPLETED" && !booking.endsAt.isAfter(LocalDateTime.now())

        return BookingReviewContext(
            bookingId = booking.id,
            userId = booking.userId,
            restaurantId = booking.restaurantId,
            status = booking.status,
            startsAt = booking.startsAt,
            endsAt = booking.endsAt,
            canReview = canReview,
            denialReason = if (canReview) null else "Booking is not completed yet"
        )
    }
}

@Component
class BookingService(
    private val bookingRepository: BookingRepository,
    private val catalogClient: CatalogClient
) {
    fun availability(
        restaurantId: Long,
        date: LocalDate,
        guestsCount: Int
    ): List<AvailabilitySlotResponse> {
        val context = catalogClient.availabilityContext(restaurantId, date, guestsCount)
        val hours = context.workingHours ?: return emptyList()
        if (!context.open || hours.opensAt == null || hours.closesAt == null) {
            return emptyList()
        }

        val slots = mutableListOf<AvailabilitySlotResponse>()
        var startsAt = LocalDateTime.of(date, hours.opensAt)
        val closesAt = LocalDateTime.of(date, hours.closesAt)

        while (!startsAt.plusHours(2).isAfter(closesAt)) {
            val endsAt = startsAt.plusHours(2)
            context.tables
                .filter { bookingRepository.isAvailable(it.id, startsAt, endsAt) }
                .forEach { table ->
                    slots += AvailabilitySlotResponse(
                        tableId = table.id,
                        tableNumber = table.tableNumber,
                        startsAt = startsAt,
                        endsAt = endsAt,
                        seatsCount = table.seatsCount
                    )
                }

            startsAt = startsAt.plusHours(1)
        }

        return slots
    }

    fun create(
        userId: Long,
        request: CreateBookingRequest
    ): BookingResponse {
        if (!request.endsAt.isAfter(request.startsAt)) {
            throw BadRequestException("endsAt must be after startsAt")
        }

        val context = catalogClient.bookingContext(
            restaurantId = request.restaurantId,
            tableId = request.tableId,
            guestsCount = request.guestsCount,
            startsAt = request.startsAt,
            endsAt = request.endsAt
        )

        if (!bookingRepository.isAvailable(request.tableId, request.startsAt, request.endsAt)) {
            throw ConflictException("This table is already booked for the selected time range")
        }

        val booking = bookingRepository.create(
            userId = userId,
            request = request,
            restaurantNameSnapshot = context.restaurant.name,
            tableNumberSnapshot = context.table.tableNumber,
            tableSeatsSnapshot = context.table.seatsCount
        )

        return booking.toResponse()
    }

    fun mine(
        userId: Long,
        page: Int,
        size: Int
    ): PageResponse<BookingResponse> {
        val result = bookingRepository.findMine(userId, page, size)
        return PageResponse(
            items = result.items.map { it.toResponse() },
            page = page,
            size = size,
            totalItems = result.totalItems,
            totalPages = if (result.totalItems == 0L) 0 else ((result.totalItems + size - 1) / size).toInt()
        )
    }

    fun byId(
        userId: Long,
        bookingId: Long
    ) = (bookingRepository.findByIdAndUserId(bookingId, userId)
        ?: throw NotFoundException("Booking not found")).toResponse()

    fun cancel(
        userId: Long,
        bookingId: Long
    ): BookingResponse {
        val booking = bookingRepository.findByIdAndUserId(bookingId, userId)
            ?: throw NotFoundException("Booking not found")

        if (booking.startsAt.isBefore(LocalDateTime.now())) {
            throw UnprocessableEntityException("Past bookings cannot be cancelled")
        }

        return bookingRepository.updateStatus(bookingId, "CANCELLED").toResponse()
    }
}

@Component
class CatalogClient(
    serviceUrls: ServiceUrls
) {
    private val restClient = RestClient.builder()
        .baseUrl(serviceUrls.catalogBaseUrl)
        .build()

    fun bookingContext(
        restaurantId: Long,
        tableId: Long,
        guestsCount: Int,
        startsAt: LocalDateTime,
        endsAt: LocalDateTime
    ): RestaurantBookingContext =
        restClient.get()
            .uri {
                it.path("/internal/v1/restaurants/{restaurantId}/booking-context")
                    .queryParam("tableId", tableId)
                    .queryParam("guestsCount", guestsCount)
                    .queryParam("startsAt", startsAt)
                    .queryParam("endsAt", endsAt)
                    .build(restaurantId)
            }
            .retrieve()
            .body(RestaurantBookingContext::class.java)
            ?: error("Catalog service returned empty booking context")

    fun availabilityContext(
        restaurantId: Long,
        date: LocalDate,
        guestsCount: Int
    ): AvailabilityContextResponse =
        restClient.get()
            .uri {
                it.path("/internal/v1/restaurants/{restaurantId}/availability-context")
                    .queryParam("date", date)
                    .queryParam("guestsCount", guestsCount)
                    .build(restaurantId)
            }
            .retrieve()
            .body(AvailabilityContextResponse::class.java)
            ?: error("Catalog service returned empty availability context")
}

@Component
class BookingRepository(
    private val jdbc: NamedParameterJdbcTemplate
) {
    fun create(
        userId: Long,
        request: CreateBookingRequest,
        restaurantNameSnapshot: String,
        tableNumberSnapshot: String,
        tableSeatsSnapshot: Int
    ): BookingRecord {
        val id = jdbc.queryForObject(
            """
            insert into bookings(
                user_id, restaurant_id, table_id, status, guests_count, starts_at, ends_at,
                special_requests, restaurant_name_snapshot, table_number_snapshot, table_seats_snapshot,
                created_at, updated_at
            )
            values (
                :userId, :restaurantId, :tableId, 'CONFIRMED', :guestsCount, :startsAt, :endsAt,
                :specialRequests, :restaurantNameSnapshot, :tableNumberSnapshot, :tableSeatsSnapshot,
                now(), now()
            )
            returning id
            """.trimIndent(),
            MapSqlParameterSource()
                .addValue("userId", userId)
                .addValue("restaurantId", request.restaurantId)
                .addValue("tableId", request.tableId)
                .addValue("guestsCount", request.guestsCount)
                .addValue("startsAt", request.startsAt)
                .addValue("endsAt", request.endsAt)
                .addValue("specialRequests", request.specialRequests)
                .addValue("restaurantNameSnapshot", restaurantNameSnapshot)
                .addValue("tableNumberSnapshot", tableNumberSnapshot)
                .addValue("tableSeatsSnapshot", tableSeatsSnapshot),
            Long::class.java
        ) ?: error("Failed to create booking")

        return findById(id) ?: error("Created booking not found")
    }

    fun findMine(
        userId: Long,
        page: Int,
        size: Int
    ): PageResult<BookingRecord> {
        val params = mapOf(
            "userId" to userId,
            "limit" to size,
            "offset" to (page - 1) * size
        )

        val items = jdbc.query(
            """
            select *
            from bookings
            where user_id = :userId
            order by starts_at desc
            limit :limit offset :offset
            """.trimIndent(),
            params
        ) { rs, _ -> rs.toBookingRecord() }

        val total = jdbc.queryForObject(
            "select count(*) from bookings where user_id = :userId",
            params,
            Long::class.java
        ) ?: 0L

        return PageResult(items, total)
    }

    fun findByIdAndUserId(
        id: Long,
        userId: Long
    ): BookingRecord? =
        jdbc.query(
            "select * from bookings where id = :id and user_id = :userId",
            mapOf("id" to id, "userId" to userId)
        ) { rs, _ -> rs.toBookingRecord() }.firstOrNull()

    fun findById(id: Long): BookingRecord? =
        jdbc.query(
            "select * from bookings where id = :id",
            mapOf("id" to id)
        ) { rs, _ -> rs.toBookingRecord() }.firstOrNull()

    fun updateStatus(
        id: Long,
        status: String
    ): BookingRecord {
        jdbc.update(
            "update bookings set status = :status, updated_at = now() where id = :id",
            mapOf("id" to id, "status" to status)
        )
        return findById(id) ?: throw NotFoundException("Booking not found")
    }

    fun isAvailable(
        tableId: Long,
        startsAt: LocalDateTime,
        endsAt: LocalDateTime
    ): Boolean =
        !(jdbc.queryForObject(
            """
            select exists(
                select 1
                from bookings
                where table_id = :tableId
                  and status <> 'CANCELLED'
                  and starts_at < :endsAt
                  and ends_at > :startsAt
            )
            """.trimIndent(),
            mapOf("tableId" to tableId, "startsAt" to startsAt, "endsAt" to endsAt),
            Boolean::class.java
        ) ?: false)
}

data class CreateBookingRequest(
    val restaurantId: Long,
    val tableId: Long,
    val startsAt: LocalDateTime,
    val endsAt: LocalDateTime,
    @field:Min(1)
    @field:Max(20)
    val guestsCount: Int,
    val specialRequests: String?
)

data class BookingResponse(
    val id: Long,
    val status: String,
    val guestsCount: Int,
    val startsAt: LocalDateTime,
    val endsAt: LocalDateTime,
    val specialRequests: String?,
    val restaurant: BookingRestaurantResponse,
    val table: BookingTableResponse,
    val createdAt: LocalDateTime
)

data class BookingRestaurantResponse(
    val id: Long,
    val name: String
)

data class BookingTableResponse(
    val id: Long,
    val tableNumber: String,
    val seatsCount: Int
)

data class AvailabilitySlotResponse(
    val tableId: Long,
    val tableNumber: String,
    val startsAt: LocalDateTime,
    val endsAt: LocalDateTime,
    val seatsCount: Int
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

data class RestaurantBookingContext(
    val restaurant: RestaurantSummaryResponse,
    val table: TableContextResponse,
    val workingHours: WorkingHoursResponse?,
    val withinWorkingHours: Boolean
)

data class AvailabilityContextResponse(
    val restaurantId: Long,
    val date: LocalDate,
    val open: Boolean,
    val workingHours: WorkingHoursResponse?,
    val tables: List<TableContextResponse>
)

data class RestaurantSummaryResponse(
    val id: Long,
    val name: String,
    val description: String?,
    val city: String,
    val street: String,
    val building: String,
    val phone: String,
    val priceSegment: String,
    val rating: BigDecimal,
    val reviewCount: Int
)

data class TableContextResponse(
    val id: Long,
    val restaurantId: Long,
    val tableNumber: String,
    val seatsCount: Int,
    val zoneName: String?,
    val active: Boolean
)

data class WorkingHoursResponse(
    val weekDay: Int,
    val opensAt: LocalTime?,
    val closesAt: LocalTime?,
    val closed: Boolean
)

data class BookingRecord(
    val id: Long,
    val userId: Long,
    val restaurantId: Long,
    val tableId: Long,
    val status: String,
    val guestsCount: Int,
    val startsAt: LocalDateTime,
    val endsAt: LocalDateTime,
    val specialRequests: String?,
    val restaurantNameSnapshot: String,
    val tableNumberSnapshot: String,
    val tableSeatsSnapshot: Int,
    val createdAt: LocalDateTime
)

data class PageResult<T>(
    val items: List<T>,
    val totalItems: Long
)

private fun BookingRecord.toResponse() =
    BookingResponse(
        id = id,
        status = status,
        guestsCount = guestsCount,
        startsAt = startsAt,
        endsAt = endsAt,
        specialRequests = specialRequests,
        restaurant = BookingRestaurantResponse(restaurantId, restaurantNameSnapshot),
        table = BookingTableResponse(tableId, tableNumberSnapshot, tableSeatsSnapshot),
        createdAt = createdAt
    )

private fun java.sql.ResultSet.toBookingRecord() =
    BookingRecord(
        id = getLong("id"),
        userId = getLong("user_id"),
        restaurantId = getLong("restaurant_id"),
        tableId = getLong("table_id"),
        status = getString("status"),
        guestsCount = getInt("guests_count"),
        startsAt = getTimestamp("starts_at").toLocalDateTime(),
        endsAt = getTimestamp("ends_at").toLocalDateTime(),
        specialRequests = getString("special_requests"),
        restaurantNameSnapshot = getString("restaurant_name_snapshot"),
        tableNumberSnapshot = getString("table_number_snapshot"),
        tableSeatsSnapshot = getInt("table_seats_snapshot"),
        createdAt = getTimestamp("created_at").toLocalDateTime()
    )
