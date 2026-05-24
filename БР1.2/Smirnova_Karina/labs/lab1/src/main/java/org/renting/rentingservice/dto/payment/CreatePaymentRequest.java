package org.renting.rentingservice.dto.payment;

import jakarta.validation.constraints.NotNull;
import lombok.Data;
import org.renting.rentingservice.domain.enums.PaymentMethod;

@Data
public class CreatePaymentRequest {
    @NotNull
    private PaymentMethod paymentMethod;
}
