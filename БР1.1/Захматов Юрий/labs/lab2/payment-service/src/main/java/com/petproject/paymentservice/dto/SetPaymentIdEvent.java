package com.petproject.paymentservice.dto;

import lombok.Builder;


@Builder
public record SetPaymentIdEvent(
        Long bookingId,
        Long paymentId
) {
}
