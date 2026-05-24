package ru.itmo.restaurantbooking.lab2.catalog.service

import org.springframework.stereotype.Service
import ru.itmo.restaurantbooking.lab2.catalog.adapter.jdbc.CatalogRepository
import ru.itmo.restaurantbooking.lab2.catalog.adapter.rest.dto.RestaurantBookingContext
import ru.itmo.restaurantbooking.lab2.catalog.adapter.rest.dto.RestaurantSearchQuery
import ru.itmo.restaurantbooking.lab2.common.exception.UnprocessableEntityException
import java.time.LocalDate
import java.time.LocalDateTime

@Service
class CatalogService(
    private val catalogRepository: CatalogRepository
) {
    fun findCuisines(search: String?) = catalogRepository.findCuisines(search)

    fun searchRestaurants(query: RestaurantSearchQuery) =
        catalogRepository.searchRestaurants(query)

    fun restaurantSummary(restaurantId: Long) =
        catalogRepository.restaurantSummary(restaurantId)

    fun restaurantDetails(restaurantId: Long) =
        catalogRepository.restaurantDetails(restaurantId)

    fun menu(restaurantId: Long, category: String?, search: String?) =
        catalogRepository.menu(restaurantId, category, search)

    fun bookingContext(
        restaurantId: Long,
        tableId: Long,
        guestsCount: Int,
        startsAt: LocalDateTime,
        endsAt: LocalDateTime
    ): RestaurantBookingContext {
        val context = catalogRepository.bookingContext(restaurantId, tableId, startsAt.toLocalDate())
        if (context.table.seatsCount < guestsCount) {
            throw UnprocessableEntityException("Table does not have enough seats")
        }

        val opensAt = context.workingHours?.opensAt
        val closesAt = context.workingHours?.closesAt
        val withinWorkingHours = context.workingHours?.closed == false &&
            opensAt != null &&
            closesAt != null &&
            !startsAt.toLocalTime().isBefore(opensAt) &&
            !endsAt.toLocalTime().isAfter(closesAt)

        if (!withinWorkingHours) {
            throw UnprocessableEntityException("Restaurant is closed for the requested time range")
        }

        return context.copy(withinWorkingHours = true)
    }

    fun availabilityContext(restaurantId: Long, date: LocalDate, guestsCount: Int) =
        catalogRepository.availabilityContext(restaurantId, date, guestsCount)
}
