package org.renting.rentingservice.service.payment;

import lombok.Builder;
import lombok.Value;
import org.renting.rentingservice.domain.enums.PaymentStatus;

@Value
@Builder
public class PaymentResult {
    PaymentStatus status;
    String paymentSystemId;
    String failureReason;
}
