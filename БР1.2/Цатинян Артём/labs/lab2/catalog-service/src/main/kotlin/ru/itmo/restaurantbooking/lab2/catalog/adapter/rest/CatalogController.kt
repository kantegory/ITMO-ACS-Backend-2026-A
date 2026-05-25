package ru.itmo.restaurantbooking.lab2.catalog.adapter.rest

import io.swagger.v3.oas.annotations.Parameter
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RestController
import ru.itmo.restaurantbooking.lab2.catalog.adapter.rest.dto.RestaurantSearchQuery
import ru.itmo.restaurantbooking.lab2.catalog.service.CatalogService

@RestController
@RequestMapping("/api/v1")
class CatalogController(
    private val catalogService: CatalogService
) {
    @GetMapping("/cuisines")
    fun cuisines(
        @Parameter(example = "Italian")
        @RequestParam(required = false) search: String?
    ) =
        catalogService.findCuisines(search)

    @GetMapping("/restaurants")
    fun restaurants(
        @Parameter(example = "garden")
        @RequestParam(required = false) search: String?,
        @Parameter(example = "European")
        @RequestParam(required = false) cuisine: String?,
        @Parameter(example = "Saint Petersburg")
        @RequestParam(required = false) city: String?,
        @Parameter(example = "MEDIUM")
        @RequestParam(required = false) priceSegment: String?,
        @Parameter(example = "1")
        @RequestParam(defaultValue = "1") page: Int,
        @Parameter(example = "10")
        @RequestParam(defaultValue = "10") size: Int
    ) = catalogService.searchRestaurants(
        RestaurantSearchQuery(
            search = search,
            cuisine = cuisine,
            city = city,
            priceSegment = priceSegment,
            page = page.coerceAtLeast(1),
            size = size.coerceIn(1, 100)
        )
    )

    @GetMapping("/restaurants/{restaurantId}")
    fun restaurant(
        @Parameter(example = "1")
        @PathVariable restaurantId: Long
    ) =
        catalogService.restaurantDetails(restaurantId)

    @GetMapping("/restaurants/{restaurantId}/menu")
    fun menu(
        @Parameter(example = "1")
        @PathVariable restaurantId: Long,
        @Parameter(example = "Main Courses")
        @RequestParam(required = false) category: String?,
        @Parameter(example = "Duck")
        @RequestParam(required = false) search: String?
    ) = catalogService.menu(restaurantId, category, search)
}
