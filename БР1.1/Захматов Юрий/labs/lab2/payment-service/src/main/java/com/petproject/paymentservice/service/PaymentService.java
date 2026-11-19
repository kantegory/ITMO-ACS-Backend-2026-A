package com.petproject.paymentservice.service;


import com.petproject.paymentservice.dto.BookingResponse;
import com.petproject.paymentservice.dto.PaymentResponse;
import com.petproject.paymentservice.dto.SetPaymentIdEvent;
import com.petproject.paymentservice.entities.PaymentEntity;
import com.petproject.paymentservice.enums.PaymentStatus;
import com.petproject.paymentservice.feign.BookingServiceClient;
import com.petproject.paymentservice.repositories.PaymentRepository;
import com.petproject.paymentservice.security.JwtPrincipal;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Slf4j
@Service
@RequiredArgsConstructor
public class PaymentService {

    private final BookingServiceClient bookingClient;
    private final PaymentRepository paymentRepository;
    private final KafkaTemplate<String, Object> paymentKafkaTemplate;


    public PaymentResponse createPayment(Long propertyId, Long bookingId, JwtPrincipal user) {

        BookingResponse booking = bookingClient.getBookingById(propertyId, bookingId, getTokenFromContext());

        PaymentEntity entityToSave = PaymentEntity.builder()
                                                  .amount(booking.totalPrice())
                                                  .renterId(booking.renterId())
                                                  .paymentStatus(PaymentStatus.PENDING)
                                                  .build();

        var savedPayment = paymentRepository.save(entityToSave);

        SetPaymentIdEvent setPaymentIdEvent = SetPaymentIdEvent
                .builder()
                .paymentId(savedPayment.getId())
                .bookingId(bookingId)
                .build();
        paymentKafkaTemplate.send("payment.status.updated", setPaymentIdEvent);
        log.info("Sending SetPaymentIdEvent: bookingId={}, paymentId={}", bookingId, savedPayment.getId());

        return mapToResponse(savedPayment);
    }

    private String getTokenFromContext() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getCredentials() != null) {
            String token = (String) auth.getCredentials();
            return token.startsWith("Bearer ") ? token : "Bearer " + token;
        }
        return null;
    }


    private PaymentResponse mapToResponse(PaymentEntity request) {
        return PaymentResponse.builder()
                              .id(request.getId())
                              .amount(request.getAmount())
                              .payedAt(request.getPayedAt())
                              .createdAt(request.getCreatedAt())
                              .status(request.getPaymentStatus())
                              .build();
    }

    public PaymentResponse getById(Long id, Long bookingId, JwtPrincipal user) {
        PaymentEntity entity = paymentRepository.findById(id).orElseThrow(
                () -> new EntityNotFoundException("Payment not found with id " + id)
        );


        if (!user.userId().equals(entity.getRenterId())) {
            throw new SecurityException("You are not allowed to perform this action");
        }

        return mapToResponse(entity);
    }

    public PaymentResponse providePayment(Long id, Long bookingId, JwtPrincipal user) {
        PaymentEntity entity = paymentRepository.findById(id).orElseThrow(
                () -> new EntityNotFoundException("Payment not found with id " + id)
        );

        if (!user.userId().equals(entity.getRenterId())) {
            throw new SecurityException("You are not allowed to perform this action");
        }
        // Заглушка
        entity.setPaymentStatus(PaymentStatus.APPROVED);
        entity.setPayedAt(LocalDateTime.now());
        var saved = paymentRepository.save(entity);

        return mapToResponse(saved);
    }
}
