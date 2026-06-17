package ru.itmo.restaurantbooking.restaurant.adapter.jdbc

import org.jooq.Configuration
import org.jooq.DSLContext
import org.jooq.Field
import org.jooq.SortField
import org.jooq.impl.DSL
import org.jooq.impl.DSL.avg
import org.jooq.impl.DSL.countDistinct
import org.springframework.stereotype.Component
import ru.itmo.restaurantbooking.common.adapter.jdbc.eqIfNotNull
import ru.itmo.restaurantbooking.common.adapter.jdbc.likeIgnoreCaseIfNotBlank
import ru.itmo.restaurantbooking.common.domain.PageResult
import ru.itmo.restaurantbooking.common.domain.SortDirection
import ru.itmo.restaurantbooking.common.domain.safeOffset
import ru.itmo.restaurantbooking.jooq.tables.Cuisines.CUISINES
import ru.itmo.restaurantbooking.jooq.tables.RestaurantCuisines.RESTAURANT_CUISINES
import ru.itmo.restaurantbooking.jooq.tables.RestaurantTables.RESTAURANT_TABLES
import ru.itmo.restaurantbooking.jooq.tables.Restaurants.RESTAURANTS
import ru.itmo.restaurantbooking.jooq.tables.Reviews.REVIEWS
import ru.itmo.restaurantbooking.jooq.tables.daos.RestaurantsDao as JooqRestaurantsDao
import ru.itmo.restaurantbooking.jooq.tables.pojos.Restaurants
import ru.itmo.restaurantbooking.restaurant.service.RestaurantSearchQuery
import ru.itmo.restaurantbooking.restaurant.service.RestaurantSortBy
import java.math.BigDecimal
import java.math.RoundingMode

@Component
class RestaurantDao(
    configuration: Configuration,
    private val dsl: DSLContext
) : JooqRestaurantsDao(configuration) {
    fun findActiveById(
        id: Long
    ) = dsl.selectFrom(RESTAURANTS)
            .where(RESTAURANTS.ID.eq(id).and(RESTAURANTS.IS_ACTIVE.isTrue))
            .fetchOneInto(Restaurants::class.java)

    fun searchRestaurantIds(
        query: RestaurantSearchQuery
    ): PageResult<Long> {
        val conditions = listOfNotNull(
            RESTAURANTS.IS_ACTIVE.isTrue,
            likeIgnoreCaseIfNotBlank(RESTAURANTS.NAME, query.search),
            likeIgnoreCaseIfNotBlank(RESTAURANTS.CITY, query.city),
            eqIfNotNull(RESTAURANTS.PRICE_SEGMENT, query.priceSegment),
            likeIgnoreCaseIfNotBlank(CUISINES.NAME, query.cuisine),
            query.guestsCount?.let(::hasTableForGuestsCondition)
        )

        val ratingField: Field<BigDecimal> = DSL.coalesce(
            avg(REVIEWS.RATING).cast(BigDecimal::class.java),
            BigDecimal.ZERO
        )
        val reviewCountField: Field<Int> = countDistinct(REVIEWS.ID).cast(Int::class.java)

        val ids = dsl.select(RESTAURANTS.ID)
            .from(RESTAURANTS)
            .leftJoin(RESTAURANT_CUISINES).on(RESTAURANT_CUISINES.RESTAURANT_ID.eq(RESTAURANTS.ID))
            .leftJoin(CUISINES).on(CUISINES.ID.eq(RESTAURANT_CUISINES.CUISINE_ID))
            .leftJoin(REVIEWS).on(REVIEWS.RESTAURANT_ID.eq(RESTAURANTS.ID))
            .where(conditions)
            .groupBy(RESTAURANTS.ID)
            .orderBy(restaurantOrderBy(query.sortBy, query.sortDirection, ratingField, reviewCountField))
            .limit(query.size)
            .offset(safeOffset(query.page, query.size))
            .fetch(RESTAURANTS.ID)

        val total = dsl.selectCount()
            .from(
                dsl.selectDistinct(RESTAURANTS.ID)
                    .from(RESTAURANTS)
                    .leftJoin(RESTAURANT_CUISINES).on(RESTAURANT_CUISINES.RESTAURANT_ID.eq(RESTAURANTS.ID))
                    .leftJoin(CUISINES).on(CUISINES.ID.eq(RESTAURANT_CUISINES.CUISINE_ID))
                    .where(conditions)
            )
            .fetchOne(0, Long::class.java)
            ?: 0L

        return PageResult(ids, total)
    }

    fun findByIds(
        ids: List<Long>
    ): List<Restaurants> {
        if (ids.isEmpty()) {
            return emptyList()
        }

        return dsl.selectFrom(RESTAURANTS)
            .where(RESTAURANTS.ID.`in`(ids))
            .fetchInto(Restaurants::class.java)
    }

    fun getAverageRating(
        restaurantId: Long
    ): BigDecimal {
        val value = dsl.select(avg(REVIEWS.RATING).cast(BigDecimal::class.java))
            .from(REVIEWS)
            .where(REVIEWS.RESTAURANT_ID.eq(restaurantId))
            .fetchOne(0, BigDecimal::class.java)

        return value?.setScale(1, RoundingMode.HALF_UP) ?: BigDecimal.ZERO.setScale(1)
    }

    fun getReviewCount(
        restaurantId: Long
    ) = dsl.select(countDistinct(REVIEWS.ID).cast(Int::class.java))
            .from(REVIEWS)
            .where(REVIEWS.RESTAURANT_ID.eq(restaurantId))
            .fetchOne(0, Int::class.java)
            ?: 0

    fun findCuisineNames(
        restaurantId: Long
    ) = dsl.select(CUISINES.NAME)
            .from(RESTAURANT_CUISINES)
            .join(CUISINES).on(CUISINES.ID.eq(RESTAURANT_CUISINES.CUISINE_ID))
            .where(RESTAURANT_CUISINES.RESTAURANT_ID.eq(restaurantId))
            .fetch(CUISINES.NAME)

    private fun hasTableForGuestsCondition(
        guestsCount: Int
    ) = DSL.exists(
            dsl.selectOne()
                .from(RESTAURANT_TABLES)
                .where(
                    RESTAURANT_TABLES.RESTAURANT_ID.eq(RESTAURANTS.ID),
                    RESTAURANT_TABLES.SEATS_COUNT.ge(guestsCount),
                    RESTAURANT_TABLES.IS_ACTIVE.isTrue
                )
        )

    private fun restaurantOrderBy(
        sortBy: RestaurantSortBy,
        sortDirection: SortDirection,
        ratingField: Field<BigDecimal>,
        reviewCountField: Field<Int>
    ): List<SortField<*>> {
        val primary = when (sortBy) {
            RestaurantSortBy.NAME -> RESTAURANTS.NAME.sort(sortDirection.toSortOrder())
            RestaurantSortBy.RATING -> ratingField.sort(sortDirection.toSortOrder())
            RestaurantSortBy.REVIEW_COUNT -> reviewCountField.sort(sortDirection.toSortOrder())
            RestaurantSortBy.PRICE_SEGMENT -> RESTAURANTS.PRICE_SEGMENT.sort(sortDirection.toSortOrder())
        }

        val secondary = if (sortBy == RestaurantSortBy.NAME) {
            RESTAURANTS.ID.asc()
        } else {
            RESTAURANTS.NAME.asc()
        }

        return listOf(primary, secondary)
    }

    private fun SortDirection.toSortOrder() =
        when (this) {
            SortDirection.ASC -> org.jooq.SortOrder.ASC
            SortDirection.DESC -> org.jooq.SortOrder.DESC
        }
}
