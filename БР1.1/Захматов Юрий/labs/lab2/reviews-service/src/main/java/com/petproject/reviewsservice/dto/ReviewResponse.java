package com.petproject.reviewsservice.dto;

import lombok.Builder;

import java.time.LocalDateTime;

@Builder
public record ReviewResponse(
        Long id,
        Long userId,
        Long propertyId,
        Integer rating,
        String comment,
        LocalDateTime createdAt
) {

}
