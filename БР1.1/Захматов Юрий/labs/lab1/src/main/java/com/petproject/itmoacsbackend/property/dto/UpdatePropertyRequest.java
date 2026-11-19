package com.petproject.itmoacsbackend.property.dto;

import jakarta.validation.constraints.Positive;
import java.util.List;

public record UpdatePropertyRequest(
        String title,
        String description,
        @Positive Float price,
        @Positive Float square,
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
        List<String> amenities
) {}