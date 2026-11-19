package com.petproject.bookingservice.dto;


import com.petproject.bookingservice.enums.PaymentStatus;
import lombok.Builder;

import java.time.LocalDateTime;

@Builder
public record PaymentResponse(
    Long id,
    Double amount,
    LocalDateTime payedAt,
    LocalDateTime createdAt,
    PaymentStatus status
) {

}
