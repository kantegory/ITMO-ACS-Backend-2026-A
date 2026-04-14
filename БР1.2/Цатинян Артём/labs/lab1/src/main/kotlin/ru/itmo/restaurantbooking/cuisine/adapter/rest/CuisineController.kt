package ru.itmo.restaurantbooking.cuisine.adapter.rest

import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RestController
import ru.itmo.restaurantbooking.cuisine.adapter.rest.dto.CuisineResponse
import ru.itmo.restaurantbooking.cuisine.service.CuisineService

@RestController
@RequestMapping("/api/v1/cuisines")
class CuisineController(
    private val cuisineService: CuisineService
) {

    @GetMapping
    fun list(
        @RequestParam(required = false) search: String?,
        @RequestParam(required = false, defaultValue = "asc") sortDir: String?
    ): List<CuisineResponse> = cuisineService.list(search, sortDir)
}
