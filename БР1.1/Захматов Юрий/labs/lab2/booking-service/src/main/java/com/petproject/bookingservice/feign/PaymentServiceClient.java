package com.petproject.bookingservice.feign;

import com.petproject.bookingservice.dto.PaymentResponse;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.security.core.parameters.P;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestHeader;

@FeignClient(name="payment-service")
public interface PaymentServiceClient {

    @PostMapping("/api/v1/properties/{propertyId}/bookings/{bookingId}/payments")
    PaymentResponse createPayment(
            @PathVariable("propertyId") Long propertyId,
            @PathVariable("bookingId") Long bookingId,
            @RequestHeader("Authorization") String token
    );

    @GetMapping("/api/v1/properties/{propertyId}/bookings/{bookingId}/payments/{id}")
    PaymentResponse getPaymentById(
            @PathVariable("propertyId") Long propertyId,
            @PathVariable("bookingId") Long bookingId,
            @PathVariable("id") Long paymentId,
            @RequestHeader("Authorization") String token
    );

}