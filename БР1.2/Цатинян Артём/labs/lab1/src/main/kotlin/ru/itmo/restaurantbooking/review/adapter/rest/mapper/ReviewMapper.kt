package ru.itmo.restaurantbooking.review.adapter.rest.mapper

import org.mapstruct.Mapper
import org.mapstruct.Mapping
import org.mapstruct.MappingConstants
import ru.itmo.restaurantbooking.jooq.tables.pojos.Reviews
import ru.itmo.restaurantbooking.review.adapter.rest.dto.ReviewResponse
import ru.itmo.restaurantbooking.review.adapter.rest.dto.ReviewSearchRequest
import ru.itmo.restaurantbooking.review.service.ReviewSearchQuery

@Mapper(componentModel = MappingConstants.ComponentModel.SPRING)
interface ReviewMapper {
    @Mapping(source = "sortDir", target = "sortDirection")
    fun toSearchQuery(request: ReviewSearchRequest): ReviewSearchQuery

    fun toResponse(review: Reviews): ReviewResponse
}
