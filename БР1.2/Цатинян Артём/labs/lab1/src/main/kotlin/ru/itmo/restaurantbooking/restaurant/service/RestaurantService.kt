package ru.itmo.restaurantbooking.restaurant.service

import org.springframework.stereotype.Service
import ru.itmo.restaurantbooking.common.adapter.rest.dto.PageResponse
import ru.itmo.restaurantbooking.common.exception.NotFoundException
import ru.itmo.restaurantbooking.jooq.tables.pojos.Restaurants
import ru.itmo.restaurantbooking.restaurant.adapter.jdbc.MenuCategoryDao
import ru.itmo.restaurantbooking.restaurant.adapter.jdbc.MenuItemDao
import ru.itmo.restaurantbooking.restaurant.adapter.jdbc.RestaurantDao
import ru.itmo.restaurantbooking.restaurant.adapter.jdbc.RestaurantPhotoDao
import ru.itmo.restaurantbooking.restaurant.adapter.jdbc.RestaurantTableDao
import ru.itmo.restaurantbooking.restaurant.adapter.jdbc.RestaurantWorkingHoursDao
import ru.itmo.restaurantbooking.restaurant.adapter.rest.dto.AvailabilitySlotResponse
import ru.itmo.restaurantbooking.restaurant.adapter.rest.dto.MenuCategoryResponse
import ru.itmo.restaurantbooking.restaurant.adapter.rest.dto.RestaurantDetailsResponse
import ru.itmo.restaurantbooking.restaurant.adapter.rest.dto.RestaurantSummaryResponse
import ru.itmo.restaurantbooking.restaurant.adapter.rest.mapper.RestaurantMapper
import java.time.LocalDateTime

@Service
class RestaurantService(
    private val restaurantDao: RestaurantDao,
    private val restaurantWorkingHoursDao: RestaurantWorkingHoursDao,
    private val restaurantTableDao: RestaurantTableDao,
    private val restaurantPhotoDao: RestaurantPhotoDao,
    private val menuCategoryDao: MenuCategoryDao,
    private val menuItemDao: MenuItemDao,
    private val restaurantMapper: RestaurantMapper
) {
    fun search(
        query: RestaurantSearchQuery
    ): PageResponse<RestaurantSummaryResponse> {
        val idsPage = restaurantDao.searchRestaurantIds(query)
        val restaurants = restaurantDao.findByIds(idsPage.items).associateBy { it.id }
        val items = idsPage.items.mapNotNull { id ->
            restaurants[id]?.let(::toSummaryResponse)
        }

        return PageResponse(
            items = items,
            page = query.page,
            size = query.size,
            totalItems = idsPage.totalItems,
            totalPages = idsPage.totalPages(query.size)
        )
    }

    fun getDetails(
        restaurantId: Long
    ): RestaurantDetailsResponse {
        val restaurant = restaurantDao.findActiveById(restaurantId)
            ?: throw NotFoundException("Restaurant not found")

        return RestaurantDetailsResponse(
            id = restaurant.id,
            name = restaurant.name,
            description = restaurant.description,
            city = restaurant.city,
            street = restaurant.street,
            building = restaurant.building,
            phone = restaurant.phone,
            priceSegment = restaurant.priceSegment,
            bookingPolicy = restaurant.bookingPolicy,
            cuisines = restaurantDao.findCuisineNames(restaurantId),
            workingHours = restaurantWorkingHoursDao.findByRestaurantId(restaurantId)
                .map(restaurantMapper::toWorkingHoursResponse),
            photos = restaurantPhotoDao.findByRestaurantId(restaurantId)
                .map(restaurantMapper::toPhotoResponse),
            rating = restaurantDao.getAverageRating(restaurantId),
            reviewCount = restaurantDao.getReviewCount(restaurantId)
        )
    }

    fun getAvailability(
        restaurantId: Long,
        query: RestaurantAvailabilityQuery
    ): List<AvailabilitySlotResponse> {
        restaurantDao.findActiveById(restaurantId)
            ?: throw NotFoundException("Restaurant not found")

        val workingHours = restaurantWorkingHoursDao.findByRestaurantId(restaurantId)
            .firstOrNull { it.weekDay == query.date.dayOfWeek.value }
            ?: return emptyList()

        if (workingHours.isClosed == true || workingHours.opensAt == null || workingHours.closesAt == null) {
            return emptyList()
        }

        val results = mutableListOf<AvailabilitySlotResponse>()
        var startsAt = LocalDateTime.of(query.date, workingHours.opensAt)
        val closeAt = LocalDateTime.of(query.date, workingHours.closesAt)

        while (startsAt.plusHours(2) <= closeAt) {
            val endsAt = startsAt.plusHours(2)

            restaurantTableDao.findAvailableTables(
                restaurantId = restaurantId,
                guestsCount = query.guestsCount,
                startsAt = startsAt,
                endsAt = endsAt
            ).forEach { table ->
                results += AvailabilitySlotResponse(
                    tableId = table.id,
                    tableNumber = table.tableNumber,
                    startsAt = startsAt,
                    endsAt = endsAt,
                    seatsCount = table.seatsCount
                )
            }

            startsAt = startsAt.plusHours(1)
        }

        return results
    }

    fun getMenu(
        restaurantId: Long,
        query: RestaurantMenuQuery
    ): List<MenuCategoryResponse> {
        restaurantDao.findActiveById(restaurantId)
            ?: throw NotFoundException("Restaurant not found")

        val categories = menuCategoryDao.findByRestaurantId(restaurantId)
        val items = menuItemDao.findByRestaurantId(
            restaurantId = restaurantId,
            query = query
        )

        val itemsByCategory = items.groupBy { it.menuCategoryId }
            .mapValues { (_, categoryItems) ->
                categoryItems.map(restaurantMapper::toMenuItemResponse)
            }

        return categories
            .asSequence()
            .filter { category ->
                query.category.isNullOrBlank() || category.name.contains(query.category, ignoreCase = true)
            }
            .map { category ->
                MenuCategoryResponse(
                    id = category.id,
                    name = category.name,
                    sortOrder = category.sortOrder,
                    items = itemsByCategory[category.id].orEmpty()
                )
            }
            .filter { category ->
                category.items.isNotEmpty() || query.search.isNullOrBlank()
            }
            .toList()
    }

    private fun toSummaryResponse(
        restaurant: Restaurants
    ) =
        RestaurantSummaryResponse(
            id = restaurant.id,
            name = restaurant.name,
            description = restaurant.description,
            city = restaurant.city,
            street = restaurant.street,
            building = restaurant.building,
            phone = restaurant.phone,
            priceSegment = restaurant.priceSegment,
            rating = restaurantDao.getAverageRating(restaurant.id),
            reviewCount = restaurantDao.getReviewCount(restaurant.id)
        )
}
