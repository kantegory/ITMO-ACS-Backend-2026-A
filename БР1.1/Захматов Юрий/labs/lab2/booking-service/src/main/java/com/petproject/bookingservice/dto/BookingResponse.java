package com.petproject.bookingservice.dto;

import com.petproject.bookingservice.enums.BookingStatus;
import com.petproject.bookingservice.enums.PaymentStatus;
import lombok.Builder;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Builder
public record BookingResponse(
        Long id,
        Long renterId,
        Long propertyId,
        PaymentResponse paymentInfo,
        LocalDate startDate,
        LocalDate endDate,
        BookingStatus status,
        Double totalPrice,
        Integer guestsCount,
        String details,
        LocalDateTime createdAt
) {
}
