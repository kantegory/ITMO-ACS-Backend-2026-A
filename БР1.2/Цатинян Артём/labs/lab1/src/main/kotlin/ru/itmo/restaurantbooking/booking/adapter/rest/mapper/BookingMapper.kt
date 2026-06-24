package ru.itmo.restaurantbooking.booking.adapter.rest.mapper

import org.mapstruct.Mapper
import org.mapstruct.Mapping
import org.mapstruct.MappingConstants
import ru.itmo.restaurantbooking.booking.adapter.rest.dto.BookingRestaurantResponse
import ru.itmo.restaurantbooking.booking.adapter.rest.dto.BookingSearchRequest
import ru.itmo.restaurantbooking.booking.adapter.rest.dto.BookingTableResponse
import ru.itmo.restaurantbooking.booking.service.BookingSearchQuery
import ru.itmo.restaurantbooking.jooq.tables.pojos.RestaurantTables
import ru.itmo.restaurantbooking.jooq.tables.pojos.Restaurants

@Mapper(componentModel = MappingConstants.ComponentModel.SPRING)
interface BookingMapper {
    @Mapping(source = "sortDir", target = "sortDirection")
    fun toSearchQuery(request: BookingSearchRequest): BookingSearchQuery

    fun toRestaurantResponse(restaurant: Restaurants): BookingRestaurantResponse

    fun toTableResponse(table: RestaurantTables): BookingTableResponse
}
