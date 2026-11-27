package ru.itmo.restaurantbooking.lab2.catalog.adapter.jooq

import org.jooq.Condition
import org.jooq.DSLContext
import org.jooq.Record
import org.jooq.impl.DSL.coalesce
import org.jooq.impl.DSL.exists
import org.springframework.stereotype.Repository
import org.springframework.transaction.annotation.Transactional
import ru.itmo.restaurantbooking.lab2.catalog.adapter.rest.dto.AvailabilityContextResponse
import ru.itmo.restaurantbooking.lab2.catalog.adapter.rest.dto.CuisineResponse
import ru.itmo.restaurantbooking.lab2.catalog.adapter.rest.dto.MenuCategoryResponse
import ru.itmo.restaurantbooking.lab2.catalog.adapter.rest.dto.MenuItemResponse
import ru.itmo.restaurantbooking.lab2.catalog.adapter.rest.dto.RestaurantBookingContext
import ru.itmo.restaurantbooking.lab2.catalog.adapter.rest.dto.RestaurantDetailsResponse
import ru.itmo.restaurantbooking.lab2.catalog.adapter.rest.dto.RestaurantSearchQuery
import ru.itmo.restaurantbooking.lab2.catalog.adapter.rest.dto.RestaurantSummaryResponse
import ru.itmo.restaurantbooking.lab2.catalog.adapter.rest.dto.TableContextResponse
import ru.itmo.restaurantbooking.lab2.catalog.adapter.rest.dto.WorkingHoursResponse
import ru.itmo.restaurantbooking.lab2.catalog.jooq.tables.Cuisines.CUISINES
import ru.itmo.restaurantbooking.lab2.catalog.jooq.tables.MenuCategories.MENU_CATEGORIES
import ru.itmo.restaurantbooking.lab2.catalog.jooq.tables.MenuItems.MENU_ITEMS
import ru.itmo.restaurantbooking.lab2.catalog.jooq.tables.ProcessedReviewEvents.PROCESSED_REVIEW_EVENTS
import ru.itmo.restaurantbooking.lab2.catalog.jooq.tables.RestaurantCuisines.RESTAURANT_CUISINES
import ru.itmo.restaurantbooking.lab2.catalog.jooq.tables.RestaurantRatingStats.RESTAURANT_RATING_STATS
import ru.itmo.restaurantbooking.lab2.catalog.jooq.tables.RestaurantTables.RESTAURANT_TABLES
import ru.itmo.restaurantbooking.lab2.catalog.jooq.tables.RestaurantWorkingHours.RESTAURANT_WORKING_HOURS
import ru.itmo.restaurantbooking.lab2.catalog.jooq.tables.Restaurants.RESTAURANTS
import ru.itmo.restaurantbooking.lab2.common.dto.PageResponse
import ru.itmo.restaurantbooking.lab2.common.exception.NotFoundException
import java.math.BigDecimal
import java.math.RoundingMode
import java.time.LocalDate
import java.time.LocalDateTime

@Repository
class CatalogRepository(
    private val dsl: DSLContext
) {
    fun findCuisines(search: String?): List<CuisineResponse> {
        val condition = search?.takeIf { it.isNotBlank() }
            ?.let { CUISINES.NAME.containsIgnoreCase(it) }

        return dsl.select(CUISINES.ID, CUISINES.NAME)
            .from(CUISINES)
            .where(condition ?: org.jooq.impl.DSL.trueCondition())
            .orderBy(CUISINES.NAME)
            .fetch { CuisineResponse(it[CUISINES.ID], it[CUISINES.NAME]) }
    }

    fun searchRestaurants(query: RestaurantSearchQuery): PageResponse<RestaurantSummaryResponse> {
        val conditions = mutableListOf<Condition>(RESTAURANTS.IS_ACTIVE.eq(true))
        query.search?.takeIf { it.isNotBlank() }?.let {
            conditions += RESTAURANTS.NAME.containsIgnoreCase(it)
        }
        query.city?.takeIf { it.isNotBlank() }?.let {
            conditions += RESTAURANTS.CITY.containsIgnoreCase(it)
        }
        query.priceSegment?.takeIf { it.isNotBlank() }?.let {
            conditions += RESTAURANTS.PRICE_SEGMENT.eq(it)
        }
        query.cuisine?.takeIf { it.isNotBlank() }?.let { cuisine ->
            conditions += exists(
                dsl.selectOne()
                    .from(RESTAURANT_CUISINES)
                    .join(CUISINES).on(CUISINES.ID.eq(RESTAURANT_CUISINES.CUISINE_ID))
                    .where(RESTAURANT_CUISINES.RESTAURANT_ID.eq(RESTAURANTS.ID))
                    .and(CUISINES.NAME.containsIgnoreCase(cuisine))
            )
        }

        val averageRating = coalesce(RESTAURANT_RATING_STATS.AVERAGE_RATING, BigDecimal.ZERO).`as`("average_rating")
        val reviewCount = coalesce(RESTAURANT_RATING_STATS.REVIEW_COUNT, 0).`as`("review_count")

        val items = dsl.select(
            RESTAURANTS.ID,
            RESTAURANTS.NAME,
            RESTAURANTS.DESCRIPTION,
            RESTAURANTS.CITY,
            RESTAURANTS.STREET,
            RESTAURANTS.BUILDING,
            RESTAURANTS.PHONE,
            RESTAURANTS.PRICE_SEGMENT,
            averageRating,
            reviewCount
        )
            .from(RESTAURANTS)
            .leftJoin(RESTAURANT_RATING_STATS).on(RESTAURANT_RATING_STATS.RESTAURANT_ID.eq(RESTAURANTS.ID))
            .where(conditions)
            .orderBy(averageRating.desc(), RESTAURANTS.NAME.asc())
            .limit(query.size)
            .offset((query.page - 1) * query.size)
            .fetch { it.toRestaurantSummary() }

        val total = dsl.fetchCount(RESTAURANTS, conditions).toLong()
        return PageResponse(
            items = items,
            page = query.page,
            size = query.size,
            totalItems = total,
            totalPages = if (total == 0L) 0 else ((total + query.size - 1) / query.size).toInt()
        )
    }

    fun restaurantSummary(restaurantId: Long): RestaurantSummaryResponse {
        val averageRating = coalesce(RESTAURANT_RATING_STATS.AVERAGE_RATING, BigDecimal.ZERO).`as`("average_rating")
        val reviewCount = coalesce(RESTAURANT_RATING_STATS.REVIEW_COUNT, 0).`as`("review_count")

        return dsl.select(
            RESTAURANTS.ID,
            RESTAURANTS.NAME,
            RESTAURANTS.DESCRIPTION,
            RESTAURANTS.CITY,
            RESTAURANTS.STREET,
            RESTAURANTS.BUILDING,
            RESTAURANTS.PHONE,
            RESTAURANTS.PRICE_SEGMENT,
            averageRating,
            reviewCount
        )
            .from(RESTAURANTS)
            .leftJoin(RESTAURANT_RATING_STATS).on(RESTAURANT_RATING_STATS.RESTAURANT_ID.eq(RESTAURANTS.ID))
            .where(RESTAURANTS.ID.eq(restaurantId))
            .and(RESTAURANTS.IS_ACTIVE.eq(true))
            .fetchOne { it.toRestaurantSummary() }
            ?: throw NotFoundException("Restaurant not found")
    }

    fun restaurantDetails(restaurantId: Long): RestaurantDetailsResponse {
        val summary = restaurantSummary(restaurantId)
        return RestaurantDetailsResponse(
            id = summary.id,
            name = summary.name,
            description = summary.description,
            city = summary.city,
            street = summary.street,
            building = summary.building,
            phone = summary.phone,
            priceSegment = summary.priceSegment,
            cuisines = cuisineNames(restaurantId),
            workingHours = workingHours(restaurantId),
            rating = summary.rating,
            reviewCount = summary.reviewCount
        )
    }

    fun menu(restaurantId: Long, category: String?, search: String?): List<MenuCategoryResponse> {
        restaurantSummary(restaurantId)

        val categoryCondition = category?.takeIf { it.isNotBlank() }
            ?.let { MENU_CATEGORIES.NAME.containsIgnoreCase(it) }

        val categories = dsl.selectFrom(MENU_CATEGORIES)
            .where(MENU_CATEGORIES.RESTAURANT_ID.eq(restaurantId))
            .and(categoryCondition ?: org.jooq.impl.DSL.trueCondition())
            .orderBy(MENU_CATEGORIES.SORT_ORDER, MENU_CATEGORIES.NAME)
            .fetch()

        val itemCondition = search?.takeIf { it.isNotBlank() }
            ?.let { MENU_ITEMS.NAME.containsIgnoreCase(it) }

        val items = dsl.selectFrom(MENU_ITEMS)
            .where(MENU_ITEMS.RESTAURANT_ID.eq(restaurantId))
            .and(MENU_ITEMS.IS_AVAILABLE.eq(true))
            .and(itemCondition ?: org.jooq.impl.DSL.trueCondition())
            .orderBy(MENU_ITEMS.NAME)
            .fetch {
                MenuItemResponse(
                    id = it.id,
                    menuCategoryId = it.menuCategoryId,
                    name = it.name,
                    description = it.description,
                    priceMinor = it.priceMinor,
                    currencyCode = it.currencyCode,
                    available = it.isAvailable
                )
            }.groupBy { it.menuCategoryId }

        return categories.map {
            MenuCategoryResponse(
                id = it.id,
                name = it.name,
                sortOrder = it.sortOrder,
                items = items[it.id].orEmpty()
            )
        }.filter { it.items.isNotEmpty() || search.isNullOrBlank() }
    }

    fun bookingContext(restaurantId: Long, tableId: Long, date: LocalDate): RestaurantBookingContext {
        val restaurant = restaurantSummary(restaurantId)
        val table = dsl.selectFrom(RESTAURANT_TABLES)
            .where(RESTAURANT_TABLES.ID.eq(tableId))
            .and(RESTAURANT_TABLES.RESTAURANT_ID.eq(restaurantId))
            .and(RESTAURANT_TABLES.IS_ACTIVE.eq(true))
            .fetchOne {
                TableContextResponse(it.id, it.restaurantId, it.tableNumber, it.seatsCount, it.zoneName, it.isActive)
            } ?: throw NotFoundException("Table not found")

        return RestaurantBookingContext(
            restaurant = restaurant,
            table = table,
            workingHours = workingHours(restaurantId).firstOrNull { it.weekDay == date.dayOfWeek.value },
            withinWorkingHours = false
        )
    }

    fun availabilityContext(restaurantId: Long, date: LocalDate, guestsCount: Int): AvailabilityContextResponse {
        restaurantSummary(restaurantId)
        val hours = workingHours(restaurantId).firstOrNull { it.weekDay == date.dayOfWeek.value }
        val tables = dsl.selectFrom(RESTAURANT_TABLES)
            .where(RESTAURANT_TABLES.RESTAURANT_ID.eq(restaurantId))
            .and(RESTAURANT_TABLES.SEATS_COUNT.ge(guestsCount))
            .and(RESTAURANT_TABLES.IS_ACTIVE.eq(true))
            .orderBy(RESTAURANT_TABLES.SEATS_COUNT, RESTAURANT_TABLES.TABLE_NUMBER)
            .fetch {
                TableContextResponse(it.id, it.restaurantId, it.tableNumber, it.seatsCount, it.zoneName, it.isActive)
            }

        return AvailabilityContextResponse(restaurantId, date, hours?.closed == false, hours, tables)
    }

    private fun cuisineNames(restaurantId: Long): List<String> =
        dsl.select(CUISINES.NAME)
            .from(RESTAURANT_CUISINES)
            .join(CUISINES).on(CUISINES.ID.eq(RESTAURANT_CUISINES.CUISINE_ID))
            .where(RESTAURANT_CUISINES.RESTAURANT_ID.eq(restaurantId))
            .orderBy(CUISINES.NAME)
            .fetch(CUISINES.NAME)

    private fun workingHours(restaurantId: Long): List<WorkingHoursResponse> =
        dsl.selectFrom(RESTAURANT_WORKING_HOURS)
            .where(RESTAURANT_WORKING_HOURS.RESTAURANT_ID.eq(restaurantId))
            .orderBy(RESTAURANT_WORKING_HOURS.WEEK_DAY)
            .fetch {
                WorkingHoursResponse(
                    weekDay = it.weekDay,
                    opensAt = it.opensAt,
                    closesAt = it.closesAt,
                    closed = it.isClosed
                )
            }

    @Transactional
    fun applyReviewCreatedEvent(eventId: String, reviewId: Long, restaurantId: Long, rating: Int): Boolean {
        val inserted = dsl.insertInto(PROCESSED_REVIEW_EVENTS)
            .set(PROCESSED_REVIEW_EVENTS.EVENT_ID, eventId)
            .set(PROCESSED_REVIEW_EVENTS.REVIEW_ID, reviewId)
            .set(PROCESSED_REVIEW_EVENTS.PROCESSED_AT, LocalDateTime.now())
            .onConflictDoNothing()
            .execute()

        if (inserted == 0) {
            return false
        }

        val currentStats = dsl.selectFrom(RESTAURANT_RATING_STATS)
            .where(RESTAURANT_RATING_STATS.RESTAURANT_ID.eq(restaurantId))
            .forUpdate()
            .fetchOne()

        if (currentStats == null) {
            dsl.insertInto(RESTAURANT_RATING_STATS)
                .set(RESTAURANT_RATING_STATS.RESTAURANT_ID, restaurantId)
                .set(RESTAURANT_RATING_STATS.AVERAGE_RATING, BigDecimal.valueOf(rating.toLong()).setScale(1))
                .set(RESTAURANT_RATING_STATS.REVIEW_COUNT, 1)
                .execute()
            return true
        }

        val oldCount = currentStats.reviewCount
        val newCount = oldCount + 1
        val newAverage = currentStats.averageRating
            .multiply(BigDecimal.valueOf(oldCount.toLong()))
            .add(BigDecimal.valueOf(rating.toLong()))
            .divide(BigDecimal.valueOf(newCount.toLong()), 1, RoundingMode.HALF_UP)

        dsl.update(RESTAURANT_RATING_STATS)
            .set(RESTAURANT_RATING_STATS.AVERAGE_RATING, newAverage)
            .set(RESTAURANT_RATING_STATS.REVIEW_COUNT, newCount)
            .where(RESTAURANT_RATING_STATS.RESTAURANT_ID.eq(restaurantId))
            .execute()

        return true
    }
}

private fun Record.toRestaurantSummary() =
    RestaurantSummaryResponse(
        id = get(RESTAURANTS.ID),
        name = get(RESTAURANTS.NAME),
        description = get(RESTAURANTS.DESCRIPTION),
        city = get(RESTAURANTS.CITY),
        street = get(RESTAURANTS.STREET),
        building = get(RESTAURANTS.BUILDING),
        phone = get(RESTAURANTS.PHONE),
        priceSegment = get(RESTAURANTS.PRICE_SEGMENT),
        rating = get("average_rating", BigDecimal::class.java),
        reviewCount = get("review_count", Int::class.java)
    )
