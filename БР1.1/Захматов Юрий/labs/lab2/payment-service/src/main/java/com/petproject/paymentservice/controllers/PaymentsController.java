package com.petproject.paymentservice.controllers;


import com.petproject.paymentservice.dto.PaymentResponse;
import com.petproject.paymentservice.security.JwtPrincipal;
import com.petproject.paymentservice.service.PaymentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/properties/{propertyId}/bookings/{bookingId}/payments")
@RequiredArgsConstructor
public class PaymentsController {

    private final PaymentService paymentService;

    @PostMapping
    public ResponseEntity<PaymentResponse> createPayment(
            @PathVariable Long propertyId,
            @PathVariable Long bookingId,
            @AuthenticationPrincipal JwtPrincipal user
    ) {
        PaymentResponse respons = paymentService.createPayment(propertyId, bookingId, user);
        return ResponseEntity.ok().body(respons);
    }


    @GetMapping("/{id}")
    public ResponseEntity<PaymentResponse> getPayment(
            @PathVariable Long id,
            @PathVariable Long bookingId,
            @AuthenticationPrincipal JwtPrincipal user
    ) {
        PaymentResponse response = paymentService.getById(id, bookingId, user);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/{id}/pay")
    public ResponseEntity<PaymentResponse> payPayment(
            @PathVariable Long id,
            @PathVariable Long bookingId,
            @AuthenticationPrincipal JwtPrincipal user
    ) {
        PaymentResponse response = paymentService.providePayment(id, bookingId, user);
        return ResponseEntity.ok(response);
    }

}
