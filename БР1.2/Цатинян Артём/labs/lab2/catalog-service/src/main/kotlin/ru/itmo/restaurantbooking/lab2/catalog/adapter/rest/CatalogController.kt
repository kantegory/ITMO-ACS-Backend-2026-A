package ru.itmo.restaurantbooking.lab2.catalog.adapter.rest

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
    fun cuisines(@RequestParam(required = false) search: String?) =
        catalogService.findCuisines(search)

    @GetMapping("/restaurants")
    fun restaurants(
        @RequestParam(required = false) search: String?,
        @RequestParam(required = false) cuisine: String?,
        @RequestParam(required = false) city: String?,
        @RequestParam(required = false) priceSegment: String?,
        @RequestParam(defaultValue = "1") page: Int,
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
    fun restaurant(@PathVariable restaurantId: Long) =
        catalogService.restaurantDetails(restaurantId)

    @GetMapping("/restaurants/{restaurantId}/menu")
    fun menu(
        @PathVariable restaurantId: Long,
        @RequestParam(required = false) category: String?,
        @RequestParam(required = false) search: String?
    ) = catalogService.menu(restaurantId, category, search)
}
