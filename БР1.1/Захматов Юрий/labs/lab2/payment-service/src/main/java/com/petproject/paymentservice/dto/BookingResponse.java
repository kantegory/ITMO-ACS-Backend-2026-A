package com.petproject.paymentservice.dto;


import com.petproject.paymentservice.enums.BookingStatus;
import lombok.Builder;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Builder
public record BookingResponse(
        Long id,
        Long renterId,
        Long propertyId,
        Long paymentId,
        LocalDate startDate,
        LocalDate endDate,
        BookingStatus status,
        Double totalPrice,
        Integer guestsCount,
        String details,
        LocalDateTime createdAt
) {
}
