package ru.itmo.restaurantbooking.restaurant.adapter.rest

import jakarta.validation.Valid
import org.springdoc.core.annotations.ParameterObject
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.ModelAttribute
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController
import ru.itmo.restaurantbooking.restaurant.adapter.rest.dto.RestaurantAvailabilityRequest
import ru.itmo.restaurantbooking.restaurant.adapter.rest.dto.RestaurantMenuRequest
import ru.itmo.restaurantbooking.restaurant.adapter.rest.dto.RestaurantSearchRequest
import ru.itmo.restaurantbooking.restaurant.adapter.rest.mapper.RestaurantMapper
import ru.itmo.restaurantbooking.restaurant.service.RestaurantService

@RestController
@RequestMapping("/api/v1/restaurants")
class RestaurantController(
    private val restaurantService: RestaurantService,
    private val restaurantMapper: RestaurantMapper
) {
    @GetMapping
    fun search(
        @ParameterObject @Valid @ModelAttribute request: RestaurantSearchRequest
    ) = restaurantService.search(restaurantMapper.toSearchQuery(request))

    @GetMapping("/{restaurantId}")
    fun getById(
        @PathVariable restaurantId: Long
    ) = restaurantService.getDetails(restaurantId)

    @GetMapping("/{restaurantId}/availability")
    fun getAvailability(
        @PathVariable restaurantId: Long,
        @ParameterObject @Valid @ModelAttribute request: RestaurantAvailabilityRequest
    ) = restaurantService.getAvailability(
            restaurantId = restaurantId,
            query = restaurantMapper.toAvailabilityQuery(request)
        )

    @GetMapping("/{restaurantId}/menu")
    fun getMenu(
        @PathVariable restaurantId: Long,
        @ParameterObject @Valid @ModelAttribute request: RestaurantMenuRequest
    ) = restaurantService.getMenu(
            restaurantId = restaurantId,
            query = restaurantMapper.toMenuQuery(request)
        )
}
