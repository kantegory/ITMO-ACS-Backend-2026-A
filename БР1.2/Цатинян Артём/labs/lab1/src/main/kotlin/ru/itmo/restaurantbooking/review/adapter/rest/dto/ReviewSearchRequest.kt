package ru.itmo.restaurantbooking.review.adapter.rest.dto

import io.swagger.v3.oas.annotations.media.Schema
import jakarta.validation.constraints.Max
import jakarta.validation.constraints.Min
import ru.itmo.restaurantbooking.common.domain.DEFAULT_PAGE_SIZE
import ru.itmo.restaurantbooking.common.domain.MAX_PAGE_NUMBER
import ru.itmo.restaurantbooking.common.domain.MAX_PAGE_SIZE
import ru.itmo.restaurantbooking.common.domain.SortDirection

data class ReviewSearchRequest(
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
        description = "Направление сортировки отзывов по дате создания",
        example = "DESC"
    )
    val sortDir: SortDirection = SortDirection.DESC
)
