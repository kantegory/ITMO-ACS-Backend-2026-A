package ru.itmo.restaurantbooking.restaurant.adapter.rest.dto

import com.fasterxml.jackson.annotation.JsonIgnore
import io.swagger.v3.oas.annotations.media.Schema
import jakarta.validation.constraints.AssertTrue
import jakarta.validation.constraints.PositiveOrZero

data class RestaurantMenuRequest(
    @field:Schema(
        description = "Название категории меню. Его можно взять из ответа GET /api/v1/restaurants/{restaurantId}/menu без фильтров",
        example = "Паста"
    )
    val category: String? = null,
    @field:Schema(
        description = "Поиск по названию блюда",
        example = "Карбонара"
    )
    val search: String? = null,
    @field:Schema(
        description = "Фильтр только по доступным позициям меню",
        example = "true"
    )
    val available: Boolean? = null,
    @field:PositiveOrZero
    @field:Schema(
        description = "Минимальная цена блюда в рублях",
        example = "300"
    )
    val minPrice: Int? = null,
    @field:PositiveOrZero
    @field:Schema(
        description = "Максимальная цена блюда в рублях",
        example = "1200"
    )
    val maxPrice: Int? = null
) {
    @get:AssertTrue(message = "maxPrice must be greater than or equal to minPrice")
    @get:JsonIgnore
    val isPriceRangeValid: Boolean
        get() = minPrice == null || maxPrice == null || maxPrice >= minPrice
}
