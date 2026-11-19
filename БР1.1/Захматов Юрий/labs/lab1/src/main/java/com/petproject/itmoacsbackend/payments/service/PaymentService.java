package com.petproject.itmoacsbackend.payments.service;

import com.petproject.itmoacsbackend.auth.enums.GlobalRole;
import com.petproject.itmoacsbackend.booking.entities.BookingEntity;
import com.petproject.itmoacsbackend.booking.repositories.BookingRepository;
import com.petproject.itmoacsbackend.payments.dto.PaymentResponse;
import com.petproject.itmoacsbackend.payments.entities.PaymentEntity;
import com.petproject.itmoacsbackend.payments.enums.PaymentStatus;
import com.petproject.itmoacsbackend.payments.repositories.PaymentRepository;
import com.petproject.itmoacsbackend.users.entities.UserEntity;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class PaymentService {

    private final BookingRepository bookingRepository;
    private final PaymentRepository paymentRepository;

    public PaymentResponse createPayment(BookingEntity booking) {
        PaymentEntity entityToSave = PaymentEntity.builder()
                .amount(booking.getTotalPrice())
                .paymentStatus(PaymentStatus.PENDING)
                .build();

        var savedPayment = paymentRepository.save(entityToSave);

        booking.setPaymentId(savedPayment);

        bookingRepository.save(booking);

        return mapToResponse(savedPayment);
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

    public PaymentResponse getById(Long id, Long bookingId, UserEntity user) {
        PaymentEntity entity = paymentRepository.findById(id).orElseThrow(
                () -> new EntityNotFoundException("Payment not found with id " + id)
        );
        BookingEntity booking = bookingRepository.findById(bookingId).orElseThrow(
                () -> new EntityNotFoundException("Booking not found with id " + bookingId)
        );

        if (!user.getId().equals(booking.getRenterId().getId()) && !user.getGlobalRole().equals(GlobalRole.ADMIN)) {
            throw new SecurityException("You are not allowed to perform this action");
        }

        return mapToResponse(entity);
    }

    public PaymentResponse providePayment(Long id, Long bookingId, UserEntity user) {
        PaymentEntity entity = paymentRepository.findById(id).orElseThrow(
                () -> new EntityNotFoundException("Payment not found with id " + id)
        );
        BookingEntity booking = bookingRepository.findById(bookingId).orElseThrow(
                () -> new EntityNotFoundException("Booking not found with id " + bookingId)
        );

        if (!user.getId().equals(booking.getRenterId().getId()) && !user.getGlobalRole().equals(GlobalRole.ADMIN)) {
            throw new SecurityException("You are not allowed to perform this action");
        }
        // Заглушка
        entity.setPaymentStatus(PaymentStatus.APPROVED);
        entity.setPayedAt(LocalDateTime.now());
        var saved = paymentRepository.save(entity);

        return mapToResponse(saved);
    }
}
