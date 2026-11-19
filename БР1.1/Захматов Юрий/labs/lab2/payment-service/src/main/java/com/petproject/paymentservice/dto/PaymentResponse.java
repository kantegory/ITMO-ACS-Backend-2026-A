package com.petproject.paymentservice.dto;


import com.petproject.paymentservice.enums.PaymentStatus;
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
