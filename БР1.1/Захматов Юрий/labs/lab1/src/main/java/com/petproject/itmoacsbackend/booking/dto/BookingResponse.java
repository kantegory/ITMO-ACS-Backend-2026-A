package com.petproject.itmoacsbackend.booking.dto;

import com.petproject.itmoacsbackend.booking.enums.BookingStatus;
import com.petproject.itmoacsbackend.payments.dto.PaymentResponse;
import lombok.Builder;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Builder
public record BookingResponse(
        Long id,
        Long renterId,
        Long propertyId,
        PaymentResponse payment,
        LocalDate startDate,
        LocalDate endDate,
        BookingStatus status,
        Double totalPrice,
        Integer guestsCount,
        String details,
        LocalDateTime createdAt
) {
}
