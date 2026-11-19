package com.petproject.itmoacsbackend.property.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

import java.util.List;

public record CreatePropertyRequest(
        @NotBlank String title,
        String description,
        @NotNull @Positive Float price,
        @NotNull @Positive Float square,
        @NotBlank String type,
        @NotBlank String country,
        @NotBlank String region,
        @NotBlank String city,
        @NotBlank String street,
        @NotBlank String postalCode,
        String nearestSubway,
        Double latitude,
        Double longitude,
        Boolean available,
        @NotBlank
        String mainImage,

        List<String> amenities,
        List<String> imageUrls
) {
}
