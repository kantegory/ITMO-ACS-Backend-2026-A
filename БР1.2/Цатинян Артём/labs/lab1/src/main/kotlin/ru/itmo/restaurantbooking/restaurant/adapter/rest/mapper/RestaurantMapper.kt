package ru.itmo.restaurantbooking.restaurant.adapter.rest.mapper

import org.mapstruct.Mapper
import org.mapstruct.Mapping
import org.mapstruct.MappingConstants
import ru.itmo.restaurantbooking.jooq.tables.pojos.MenuItems
import ru.itmo.restaurantbooking.jooq.tables.pojos.RestaurantPhotos
import ru.itmo.restaurantbooking.jooq.tables.pojos.RestaurantWorkingHours
import ru.itmo.restaurantbooking.restaurant.adapter.rest.dto.MenuItemResponse
import ru.itmo.restaurantbooking.restaurant.adapter.rest.dto.RestaurantAvailabilityRequest
import ru.itmo.restaurantbooking.restaurant.adapter.rest.dto.RestaurantMenuRequest
import ru.itmo.restaurantbooking.restaurant.adapter.rest.dto.RestaurantPhotoResponse
import ru.itmo.restaurantbooking.restaurant.adapter.rest.dto.RestaurantSearchRequest
import ru.itmo.restaurantbooking.restaurant.adapter.rest.dto.WorkingHoursResponse
import ru.itmo.restaurantbooking.restaurant.service.RestaurantAvailabilityQuery
import ru.itmo.restaurantbooking.restaurant.service.RestaurantMenuQuery
import ru.itmo.restaurantbooking.restaurant.service.RestaurantSearchQuery

@Mapper(componentModel = MappingConstants.ComponentModel.SPRING)
interface RestaurantMapper {
    @Mapping(source = "sortDir", target = "sortDirection")
    fun toSearchQuery(request: RestaurantSearchRequest): RestaurantSearchQuery

    fun toAvailabilityQuery(request: RestaurantAvailabilityRequest): RestaurantAvailabilityQuery

    @Mapping(source = "available", target = "isAvailable")
    fun toMenuQuery(request: RestaurantMenuRequest): RestaurantMenuQuery

    @Mapping(source = "weekDay", target = "dayOfWeek")
    @Mapping(source = "opensAt", target = "openTime")
    @Mapping(source = "closesAt", target = "closeTime")
    fun toWorkingHoursResponse(workingHours: RestaurantWorkingHours): WorkingHoursResponse

    @Mapping(source = "imageUrl", target = "photoUrl")
    fun toPhotoResponse(photo: RestaurantPhotos): RestaurantPhotoResponse

    fun toMenuItemResponse(menuItem: MenuItems): MenuItemResponse
}
