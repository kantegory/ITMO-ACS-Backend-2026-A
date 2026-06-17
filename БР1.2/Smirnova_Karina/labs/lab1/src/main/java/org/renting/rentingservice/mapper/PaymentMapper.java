package org.renting.rentingservice.mapper;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.renting.rentingservice.domain.entity.PaymentEntity;
import org.renting.rentingservice.dto.payment.PaymentReceiptResponse;
import org.renting.rentingservice.dto.payment.PaymentResponse;

@Mapper(componentModel = "spring")
public interface PaymentMapper {

    @Mapping(target = "bookingId", source = "booking.id")
    PaymentResponse toResponse(PaymentEntity entity);

    @Mapping(target = "paymentId", source = "id")
    @Mapping(target = "bookingId", source = "booking.id")
    PaymentReceiptResponse toReceipt(PaymentEntity entity);
}
