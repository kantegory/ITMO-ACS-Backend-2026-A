package org.renting.rentingservice.dto.payment;

import lombok.Builder;
import lombok.Value;
import org.renting.rentingservice.domain.enums.PaymentMethod;

import java.math.BigDecimal;
import java.time.Instant;

@Value
@Builder
public class PaymentReceiptResponse {
    Long paymentId;
    Long bookingId;
    BigDecimal amount;
    BigDecimal commission;
    Instant paidAt;
    PaymentMethod paymentMethod;
}
