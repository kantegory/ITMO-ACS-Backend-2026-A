package com.petproject.bookingservice.dto;

import lombok.Builder;


@Builder
public record SetPaymentIdEvent(
        Long bookingId,
        Long paymentId
) {
}
