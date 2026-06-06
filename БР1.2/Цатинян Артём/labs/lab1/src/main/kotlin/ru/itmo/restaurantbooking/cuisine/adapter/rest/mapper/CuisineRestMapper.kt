package ru.itmo.restaurantbooking.cuisine.adapter.rest.mapper

import org.mapstruct.Mapper
import org.mapstruct.MappingConstants
import ru.itmo.restaurantbooking.cuisine.adapter.rest.dto.CuisineResponse
import ru.itmo.restaurantbooking.jooq.tables.pojos.Cuisines

@Mapper(componentModel = MappingConstants.ComponentModel.SPRING)
interface CuisineRestMapper {
    fun toResponse(cuisine: Cuisines): CuisineResponse
}
