package ru.itmo.restaurantbooking.booking.adapter.jdbc

import org.jooq.Configuration
import org.jooq.DSLContext
import org.springframework.stereotype.Component
import ru.itmo.restaurantbooking.booking.domain.BookingStatus
import ru.itmo.restaurantbooking.booking.service.BookingSearchQuery
import ru.itmo.restaurantbooking.common.adapter.jdbc.eqIfNotNull
import ru.itmo.restaurantbooking.common.adapter.jdbc.geIfNotNull
import ru.itmo.restaurantbooking.common.adapter.jdbc.ltIfNotNull
import ru.itmo.restaurantbooking.common.domain.PageResult
import ru.itmo.restaurantbooking.common.domain.SortDirection
import ru.itmo.restaurantbooking.common.domain.safeOffset
import ru.itmo.restaurantbooking.jooq.tables.Bookings.BOOKINGS
import ru.itmo.restaurantbooking.jooq.tables.daos.BookingsDao as JooqBookingsDao
import ru.itmo.restaurantbooking.jooq.tables.pojos.Bookings

@Component
class BookingDao(
    configuration: Configuration,
    private val dsl: DSLContext
) : JooqBookingsDao(configuration) {
    fun insertReturning(booking: Bookings): Bookings =
        dsl.insertInto(BOOKINGS)
            .set(dsl.newRecord(BOOKINGS, booking))
            .returning()
            .fetchOneInto(Bookings::class.java)
            ?: error("Failed to insert booking")

    fun findByIdAndUserId(
        id: Long,
        userId: Long
    ) = dsl.selectFrom(BOOKINGS)
            .where(BOOKINGS.ID.eq(id).and(BOOKINGS.USER_ID.eq(userId)))
            .fetchOneInto(Bookings::class.java)

    fun findUserBookings(
        userId: Long,
        query: BookingSearchQuery
    ): PageResult<Bookings> {
        val conditions = listOfNotNull(
            BOOKINGS.USER_ID.eq(userId),
            eqIfNotNull(BOOKINGS.STATUS, query.status),
            eqIfNotNull(BOOKINGS.RESTAURANT_ID, query.restaurantId),
            geIfNotNull(BOOKINGS.STARTS_AT, query.dateFrom?.atStartOfDay()),
            ltIfNotNull(BOOKINGS.STARTS_AT, query.dateTo?.plusDays(1)?.atStartOfDay())
        )

        val items = dsl.selectFrom(BOOKINGS)
            .where(conditions)
            .orderBy(BOOKINGS.STARTS_AT.sort(query.sortDirection.toSortOrder()))
            .limit(query.size)
            .offset(safeOffset(query.page, query.size))
            .fetchInto(Bookings::class.java)

        val total = dsl.selectCount()
            .from(BOOKINGS)
            .where(conditions)
            .fetchOne(0, Long::class.java)
            ?: 0L

        return PageResult(items, total)
    }

    fun hasOverlappingBooking(
        tableId: Long,
        startsAt: java.time.LocalDateTime,
        endsAt: java.time.LocalDateTime
    ) = dsl.fetchExists(
            dsl.selectOne()
                .from(BOOKINGS)
                .where(
                    BOOKINGS.TABLE_ID.eq(tableId),
                    BOOKINGS.STATUS.ne(BookingStatus.CANCELLED),
                    BOOKINGS.STARTS_AT.lt(endsAt),
                    BOOKINGS.ENDS_AT.gt(startsAt)
                )
        )

    private fun SortDirection.toSortOrder() =
        when (this) {
            SortDirection.ASC -> org.jooq.SortOrder.ASC
            SortDirection.DESC -> org.jooq.SortOrder.DESC
        }
}
