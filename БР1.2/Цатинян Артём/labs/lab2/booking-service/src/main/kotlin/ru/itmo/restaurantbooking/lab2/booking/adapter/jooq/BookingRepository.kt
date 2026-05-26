package ru.itmo.restaurantbooking.lab2.booking.adapter.jooq

import org.jooq.DSLContext
import org.springframework.stereotype.Repository
import ru.itmo.restaurantbooking.lab2.booking.adapter.rest.dto.CreateBookingRequest
import ru.itmo.restaurantbooking.lab2.booking.domain.BookingRecord
import ru.itmo.restaurantbooking.lab2.booking.domain.PageResult
import ru.itmo.restaurantbooking.lab2.booking.jooq.tables.Bookings.BOOKINGS
import ru.itmo.restaurantbooking.lab2.booking.jooq.tables.records.BookingsRecord
import ru.itmo.restaurantbooking.lab2.common.exception.NotFoundException
import java.time.LocalDateTime

@Repository
class BookingRepository(
    private val dsl: DSLContext
) {
    fun create(
        userId: Long,
        request: CreateBookingRequest,
        restaurantNameSnapshot: String,
        tableNumberSnapshot: String,
        tableSeatsSnapshot: Int
    ): BookingRecord {
        val now = LocalDateTime.now()
        val id = dsl.insertInto(BOOKINGS)
            .set(BOOKINGS.USER_ID, userId)
            .set(BOOKINGS.RESTAURANT_ID, request.restaurantId)
            .set(BOOKINGS.TABLE_ID, request.tableId)
            .set(BOOKINGS.STATUS, "CONFIRMED")
            .set(BOOKINGS.GUESTS_COUNT, request.guestsCount)
            .set(BOOKINGS.STARTS_AT, request.startsAt)
            .set(BOOKINGS.ENDS_AT, request.endsAt)
            .set(BOOKINGS.SPECIAL_REQUESTS, request.specialRequests)
            .set(BOOKINGS.RESTAURANT_NAME_SNAPSHOT, restaurantNameSnapshot)
            .set(BOOKINGS.TABLE_NUMBER_SNAPSHOT, tableNumberSnapshot)
            .set(BOOKINGS.TABLE_SEATS_SNAPSHOT, tableSeatsSnapshot)
            .set(BOOKINGS.CREATED_AT, now)
            .set(BOOKINGS.UPDATED_AT, now)
            .returningResult(BOOKINGS.ID)
            .fetchOne(BOOKINGS.ID)
            ?: error("Failed to create booking")

        return findById(id) ?: error("Created booking not found")
    }

    fun findMine(userId: Long, page: Int, size: Int): PageResult<BookingRecord> {
        val items = dsl.selectFrom(BOOKINGS)
            .where(BOOKINGS.USER_ID.eq(userId))
            .orderBy(BOOKINGS.STARTS_AT.desc())
            .limit(size)
            .offset((page - 1) * size)
            .fetch { it.toBookingRecord() }

        val total = dsl.fetchCount(BOOKINGS, BOOKINGS.USER_ID.eq(userId)).toLong()
        return PageResult(items, total)
    }

    fun findByIdAndUserId(id: Long, userId: Long): BookingRecord? =
        dsl.selectFrom(BOOKINGS)
            .where(BOOKINGS.ID.eq(id))
            .and(BOOKINGS.USER_ID.eq(userId))
            .fetchOne { it.toBookingRecord() }

    fun findById(id: Long): BookingRecord? =
        dsl.selectFrom(BOOKINGS)
            .where(BOOKINGS.ID.eq(id))
            .fetchOne { it.toBookingRecord() }

    fun updateStatus(id: Long, status: String): BookingRecord {
        dsl.update(BOOKINGS)
            .set(BOOKINGS.STATUS, status)
            .set(BOOKINGS.UPDATED_AT, LocalDateTime.now())
            .where(BOOKINGS.ID.eq(id))
            .execute()
        return findById(id) ?: throw NotFoundException("Booking not found")
    }

    fun isAvailable(tableId: Long, startsAt: LocalDateTime, endsAt: LocalDateTime): Boolean =
        !dsl.fetchExists(
            dsl.selectOne()
                .from(BOOKINGS)
                .where(BOOKINGS.TABLE_ID.eq(tableId))
                .and(BOOKINGS.STATUS.ne("CANCELLED"))
                .and(BOOKINGS.STARTS_AT.lt(endsAt))
                .and(BOOKINGS.ENDS_AT.gt(startsAt))
        )
}

private fun BookingsRecord.toBookingRecord() =
    BookingRecord(
        id = id,
        userId = userId,
        restaurantId = restaurantId,
        tableId = tableId,
        status = status,
        guestsCount = guestsCount,
        startsAt = startsAt,
        endsAt = endsAt,
        specialRequests = specialRequests,
        restaurantNameSnapshot = restaurantNameSnapshot,
        tableNumberSnapshot = tableNumberSnapshot,
        tableSeatsSnapshot = tableSeatsSnapshot,
        createdAt = createdAt
    )
