package ru.itmo.restaurantbooking.lab2.booking.adapter.jdbc

import org.springframework.jdbc.core.namedparam.MapSqlParameterSource
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate
import org.springframework.stereotype.Repository
import ru.itmo.restaurantbooking.lab2.booking.adapter.rest.dto.CreateBookingRequest
import ru.itmo.restaurantbooking.lab2.booking.domain.BookingRecord
import ru.itmo.restaurantbooking.lab2.booking.domain.PageResult
import ru.itmo.restaurantbooking.lab2.common.exception.NotFoundException
import java.sql.ResultSet
import java.time.LocalDateTime

@Repository
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

    fun findMine(userId: Long, page: Int, size: Int): PageResult<BookingRecord> {
        val params = mapOf("userId" to userId, "limit" to size, "offset" to (page - 1) * size)

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

    fun findByIdAndUserId(id: Long, userId: Long): BookingRecord? =
        jdbc.query(
            "select * from bookings where id = :id and user_id = :userId",
            mapOf("id" to id, "userId" to userId)
        ) { rs, _ -> rs.toBookingRecord() }.firstOrNull()

    fun findById(id: Long): BookingRecord? =
        jdbc.query("select * from bookings where id = :id", mapOf("id" to id)) { rs, _ ->
            rs.toBookingRecord()
        }.firstOrNull()

    fun updateStatus(id: Long, status: String): BookingRecord {
        jdbc.update(
            "update bookings set status = :status, updated_at = now() where id = :id",
            mapOf("id" to id, "status" to status)
        )
        return findById(id) ?: throw NotFoundException("Booking not found")
    }

    fun isAvailable(tableId: Long, startsAt: LocalDateTime, endsAt: LocalDateTime): Boolean =
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

private fun ResultSet.toBookingRecord() =
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
