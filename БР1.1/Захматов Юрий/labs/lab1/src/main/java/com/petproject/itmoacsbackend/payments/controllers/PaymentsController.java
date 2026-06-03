package com.petproject.itmoacsbackend.payments.controllers;

import com.petproject.itmoacsbackend.payments.dto.PaymentResponse;
import com.petproject.itmoacsbackend.payments.service.PaymentService;
import com.petproject.itmoacsbackend.users.entities.UserEntity;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/properties/{propertyId}/bookings/{bookingId}/payments")
@RequiredArgsConstructor
public class PaymentsController {

    private final PaymentService paymentService;

    @GetMapping("/{id}")
    public ResponseEntity<PaymentResponse> getPayment(
            @PathVariable Long id,
            @PathVariable Long bookingId,
            @AuthenticationPrincipal UserEntity user
    ) {
        PaymentResponse response = paymentService.getById(id, bookingId, user);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/{id}/pay")
    public ResponseEntity<PaymentResponse> payPayment(
            @PathVariable Long id,
            @PathVariable Long bookingId,
            @AuthenticationPrincipal UserEntity user
    ) {
        PaymentResponse response = paymentService.providePayment(id, bookingId, user);
        return ResponseEntity.ok(response);
    }

}
