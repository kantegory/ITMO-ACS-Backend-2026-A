package com.petproject.itmoacsbackend.reviews.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;


public record ReviewCreateRequest(
        @Min(value = 1, message = "Rating must be at least 1")
        @Max(value = 5, message = "Rating cannot be higher than 5")
        Integer rating,
        @NotBlank
        String comment
) {
}
