package org.renting.rentingservice.service.payment;

import lombok.RequiredArgsConstructor;
import org.renting.rentingservice.config.AppProperties;
import org.renting.rentingservice.domain.entity.PaymentEntity;
import org.renting.rentingservice.domain.enums.PaymentStatus;
import org.springframework.stereotype.Component;

import java.util.UUID;
import java.util.concurrent.ThreadLocalRandom;

@Component
@RequiredArgsConstructor
public class MockPaymentGateway implements PaymentGateway {

    private final AppProperties appProperties;

    @Override
    public PaymentResult process(PaymentEntity payment) {
        boolean success = ThreadLocalRandom.current().nextDouble() < appProperties.getPayment().getMockSuccessRate();
        if (success) {
            return PaymentResult.builder()
                    .status(PaymentStatus.SUCCESS)
                    .paymentSystemId("mock-" + UUID.randomUUID())
                    .build();
        }
        return PaymentResult.builder()
                .status(PaymentStatus.FAILED)
                .paymentSystemId("mock-" + UUID.randomUUID())
                .failureReason("Mock payment declined")
                .build();
    }
}
