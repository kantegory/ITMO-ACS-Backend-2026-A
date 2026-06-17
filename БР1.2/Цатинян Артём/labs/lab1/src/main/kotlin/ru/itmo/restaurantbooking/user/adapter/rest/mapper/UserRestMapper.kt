package ru.itmo.restaurantbooking.user.adapter.rest.mapper

import org.mapstruct.Mapper
import org.mapstruct.MappingConstants
import ru.itmo.restaurantbooking.jooq.tables.pojos.Users
import ru.itmo.restaurantbooking.user.adapter.rest.dto.UserProfileResponse

@Mapper(componentModel = MappingConstants.ComponentModel.SPRING)
interface UserRestMapper {
    fun toResponse(user: Users): UserProfileResponse
}
