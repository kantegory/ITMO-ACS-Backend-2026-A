package ru.itmo.restaurantbooking.restaurant.adapter.jdbc

import org.jooq.Configuration
import org.jooq.DSLContext
import org.springframework.stereotype.Component
import ru.itmo.restaurantbooking.jooq.tables.RestaurantPhotos.RESTAURANT_PHOTOS
import ru.itmo.restaurantbooking.jooq.tables.daos.RestaurantPhotosDao as JooqRestaurantPhotosDao
import ru.itmo.restaurantbooking.jooq.tables.pojos.RestaurantPhotos

@Component
class RestaurantPhotoDao(
    configuration: Configuration,
    private val dsl: DSLContext
) : JooqRestaurantPhotosDao(configuration) {
    fun findByRestaurantId(restaurantId: Long): List<RestaurantPhotos> = dsl.selectFrom(RESTAURANT_PHOTOS)
        .where(RESTAURANT_PHOTOS.RESTAURANT_ID.eq(restaurantId))
        .orderBy(RESTAURANT_PHOTOS.SORT_ORDER.asc())
        .fetchInto(RestaurantPhotos::class.java)
}
