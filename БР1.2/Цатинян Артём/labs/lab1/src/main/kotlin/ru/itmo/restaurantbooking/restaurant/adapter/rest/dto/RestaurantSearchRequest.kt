package ru.itmo.restaurantbooking.restaurant.adapter.rest.dto

import io.swagger.v3.oas.annotations.media.Schema
import jakarta.validation.constraints.Max
import jakarta.validation.constraints.Min
import ru.itmo.restaurantbooking.common.domain.DEFAULT_PAGE_SIZE
import ru.itmo.restaurantbooking.common.domain.MAX_GUESTS_COUNT
import ru.itmo.restaurantbooking.common.domain.MAX_PAGE_NUMBER
import ru.itmo.restaurantbooking.common.domain.MAX_PAGE_SIZE
import ru.itmo.restaurantbooking.common.domain.SortDirection
import ru.itmo.restaurantbooking.restaurant.domain.PriceSegment
import ru.itmo.restaurantbooking.restaurant.service.RestaurantSortBy

data class RestaurantSearchRequest(
    @field:Schema(
        description = "Поиск по названию ресторана",
        example = "Piazza"
    )
    val search: String? = null,
    @field:Schema(
        description = "Название кухни. Список доступных значений можно посмотреть в GET /api/v1/cuisines",
        example = "Итальянская"
    )
    val cuisine: String? = null,
    @field:Schema(
        description = "Город ресторана",
        example = "Санкт-Петербург"
    )
    val city: String? = null,
    @field:Schema(
        description = "Ценовой сегмент ресторана",
        example = "AVERAGE"
    )
    val priceSegment: PriceSegment? = null,
    @field:Min(1)
    @field:Max(MAX_GUESTS_COUNT.toLong())
    @field:Schema(
        description = "Количество гостей, под которое ищется ресторан",
        example = "2"
    )
    val guestsCount: Int? = null,
    @field:Min(1)
    @field:Max(MAX_PAGE_NUMBER.toLong())
    @field:Schema(
        description = "Номер страницы, начиная с 1",
        example = "1"
    )
    val page: Int = 1,
    @field:Min(1)
    @field:Max(MAX_PAGE_SIZE.toLong())
    @field:Schema(
        description = "Размер страницы",
        example = "10"
    )
    val size: Int = DEFAULT_PAGE_SIZE,
    @field:Schema(
        description = "Поле сортировки",
        example = "RATING"
    )
    val sortBy: RestaurantSortBy = RestaurantSortBy.RATING,
    @field:Schema(
        description = "Направление сортировки",
        example = "DESC"
    )
    val sortDir: SortDirection = SortDirection.DESC
)
