package ru.itmo.restaurantbooking.restaurant.adapter.jdbc

import org.jooq.Configuration
import org.jooq.DSLContext
import org.jooq.impl.DSL.notExists
import org.springframework.stereotype.Component
import ru.itmo.restaurantbooking.booking.domain.BookingStatus
import ru.itmo.restaurantbooking.jooq.tables.Bookings.BOOKINGS
import ru.itmo.restaurantbooking.jooq.tables.RestaurantTables.RESTAURANT_TABLES
import ru.itmo.restaurantbooking.jooq.tables.daos.RestaurantTablesDao as JooqRestaurantTablesDao
import ru.itmo.restaurantbooking.jooq.tables.pojos.RestaurantTables
import java.time.LocalDateTime

@Component
class RestaurantTableDao(
    configuration: Configuration,
    private val dsl: DSLContext
) : JooqRestaurantTablesDao(configuration) {
    fun findActiveById(
        id: Long
    ) = dsl.selectFrom(RESTAURANT_TABLES)
            .where(RESTAURANT_TABLES.ID.eq(id).and(RESTAURANT_TABLES.IS_ACTIVE.isTrue))
            .fetchOneInto(RestaurantTables::class.java)

    fun findAvailableTables(
        restaurantId: Long,
        guestsCount: Int,
        startsAt: LocalDateTime,
        endsAt: LocalDateTime
    ) = dsl.selectFrom(RESTAURANT_TABLES)
            .where(
                RESTAURANT_TABLES.RESTAURANT_ID.eq(restaurantId),
                RESTAURANT_TABLES.IS_ACTIVE.isTrue,
                RESTAURANT_TABLES.SEATS_COUNT.ge(guestsCount),
                notExists(
                    dsl.selectOne()
                        .from(BOOKINGS)
                        .where(
                            BOOKINGS.TABLE_ID.eq(RESTAURANT_TABLES.ID),
                            BOOKINGS.STATUS.ne(BookingStatus.CANCELLED),
                            BOOKINGS.STARTS_AT.lt(endsAt),
                            BOOKINGS.ENDS_AT.gt(startsAt)
                        )
                )
            )
            .orderBy(RESTAURANT_TABLES.SEATS_COUNT.asc(), RESTAURANT_TABLES.TABLE_NUMBER.asc())
            .fetchInto(RestaurantTables::class.java)
}
