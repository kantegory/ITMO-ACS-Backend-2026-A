package ru.itmo.restaurantbooking.restaurant.adapter.jdbc

import org.jooq.Configuration
import org.jooq.DSLContext
import org.springframework.stereotype.Component
import ru.itmo.restaurantbooking.jooq.tables.RestaurantWorkingHours.RESTAURANT_WORKING_HOURS
import ru.itmo.restaurantbooking.jooq.tables.daos.RestaurantWorkingHoursDao as JooqRestaurantWorkingHoursDao
import ru.itmo.restaurantbooking.jooq.tables.pojos.RestaurantWorkingHours

@Component
class RestaurantWorkingHoursDao(
    configuration: Configuration,
    private val dsl: DSLContext
) : JooqRestaurantWorkingHoursDao(configuration) {
    fun findByRestaurantId(restaurantId: Long): List<RestaurantWorkingHours> = dsl.selectFrom(RESTAURANT_WORKING_HOURS)
        .where(RESTAURANT_WORKING_HOURS.RESTAURANT_ID.eq(restaurantId))
        .orderBy(RESTAURANT_WORKING_HOURS.WEEK_DAY.asc())
        .fetchInto(RestaurantWorkingHours::class.java)
}
