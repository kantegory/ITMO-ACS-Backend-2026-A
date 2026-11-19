package com.petproject.itmoacsbackend.payments.dto;

import com.petproject.itmoacsbackend.payments.enums.PaymentStatus;
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
