package ru.itmo.restaurantbooking.cuisine.service

import org.springframework.stereotype.Service
import ru.itmo.restaurantbooking.cuisine.adapter.jdbc.CuisineDao
import ru.itmo.restaurantbooking.cuisine.adapter.rest.dto.CuisineResponse
import ru.itmo.restaurantbooking.cuisine.adapter.rest.mapper.CuisineRestMapper

@Service
class CuisineService(
    private val cuisineDao: CuisineDao,
    private val cuisineRestMapper: CuisineRestMapper
) {
    fun list(search: String?, sortDir: String?): List<CuisineResponse> =
        cuisineDao.findAll(search, sortDir).map(cuisineRestMapper::toResponse)
}
