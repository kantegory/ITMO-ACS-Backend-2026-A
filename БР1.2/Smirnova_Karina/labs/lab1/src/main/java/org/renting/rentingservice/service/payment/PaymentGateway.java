package org.renting.rentingservice.service.payment;

import org.renting.rentingservice.domain.entity.PaymentEntity;

public interface PaymentGateway {

    PaymentResult process(PaymentEntity payment);
}
