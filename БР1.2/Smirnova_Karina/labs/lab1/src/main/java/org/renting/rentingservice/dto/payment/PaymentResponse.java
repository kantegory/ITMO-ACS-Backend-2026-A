package org.renting.rentingservice.dto.payment;

import lombok.Builder;
import lombok.Value;
import org.renting.rentingservice.domain.enums.PaymentMethod;
import org.renting.rentingservice.domain.enums.PaymentStatus;

import java.math.BigDecimal;
import java.time.Instant;

@Value
@Builder
public class PaymentResponse {
    Long id;
    Long bookingId;
    String paymentSystemId;
    BigDecimal amount;
    BigDecimal commission;
    PaymentStatus status;
    PaymentMethod paymentMethod;
    String failureReason;
    Instant createdAt;
    Instant paidAt;
}
