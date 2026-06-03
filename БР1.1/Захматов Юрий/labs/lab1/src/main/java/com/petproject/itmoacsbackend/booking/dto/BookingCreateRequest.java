package com.petproject.itmoacsbackend.booking.dto;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

import java.time.LocalDate;

public record BookingCreateRequest(
        @NotNull
        LocalDate startDate,
        @NotNull
        LocalDate endDate,
        @Positive
        Double totalPrice,
        @Positive
        Integer guestsCount,
        String details
) {
}
