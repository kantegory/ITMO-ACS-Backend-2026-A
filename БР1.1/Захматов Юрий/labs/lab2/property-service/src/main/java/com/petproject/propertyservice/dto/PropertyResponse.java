package com.petproject.propertyservice.dto;

import com.petproject.propertyservice.dto.ImageResponse;
import com.petproject.propertyservice.dto.UserShortResponse;
import lombok.Builder;

import java.time.LocalDateTime;
import java.util.List;

@Builder
public record PropertyResponse(

    Long id,
    String title,
    String description,
    Float price,
    Float square,
    String type,
    String country,
    String region,
    String city,
    String street,
    String postalCode,
    String nearestSubway,
    Double latitude,
    Double longitude,
    Boolean available,

    String mainImage,

    UserShortResponse owner,

    List<ImageResponse> images,

    List<String> amenities,

    Double avgRating,

    LocalDateTime createdAt
) {}
