package org.renting.rentingservice.service;

import lombok.RequiredArgsConstructor;
import org.renting.rentingservice.config.AppProperties;
import org.renting.rentingservice.domain.entity.BookingEntity;
import org.renting.rentingservice.domain.entity.PaymentEntity;
import org.renting.rentingservice.domain.enums.BookingStatus;
import org.renting.rentingservice.domain.enums.PaymentStatus;
import org.renting.rentingservice.dto.common.PageResponse;
import org.renting.rentingservice.dto.payment.*;
import org.renting.rentingservice.exception.BusinessException;
import org.renting.rentingservice.exception.ConflictException;
import org.renting.rentingservice.exception.ForbiddenException;
import org.renting.rentingservice.exception.NotFoundException;
import org.renting.rentingservice.mapper.PaymentMapper;
import org.renting.rentingservice.repository.PaymentRepository;
import org.renting.rentingservice.service.payment.PaymentGateway;
import org.renting.rentingservice.service.payment.PaymentResult;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.util.List;

@Service
@RequiredArgsConstructor
public class PaymentService {

    private final PaymentRepository paymentRepository;
    private final BookingService bookingService;
    private final PaymentMapper paymentMapper;
    private final PaymentGateway paymentGateway;
    private final AppProperties appProperties;

    @Transactional
    public PaymentResponse createPayment(Long bookingId, Long userId, CreatePaymentRequest request) {
        BookingEntity booking = bookingService.findBooking(bookingId);
        if (!booking.getGuest().getId().equals(userId)) {
            throw new ForbiddenException("Only the guest can pay for this booking");
        }
        if (booking.getStatus() != BookingStatus.PENDING) {
            throw new BusinessException("Payment is only allowed for pending bookings");
        }
        if (paymentRepository.existsByBookingIdAndStatus(bookingId, PaymentStatus.NEW)) {
            throw new ConflictException("A pending payment already exists for this booking");
        }
        if (paymentRepository.existsByBookingIdAndStatus(bookingId, PaymentStatus.SUCCESS)) {
            throw new ConflictException("Booking is already paid");
        }
        BigDecimal commission = calculateCommission(booking.getTotalAmount());
        PaymentEntity payment = PaymentEntity.builder()
                .booking(booking)
                .amount(booking.getTotalAmount())
                .commission(commission)
                .status(PaymentStatus.NEW)
                .paymentMethod(request.getPaymentMethod())
                .build();
        payment = paymentRepository.save(payment);
        return applyGatewayResult(payment);
    }

    @Transactional(readOnly = true)
    public PageResponse<PaymentResponse> listByBooking(Long bookingId, Long userId, PaymentStatus status, Pageable pageable) {
        BookingEntity booking = bookingService.findBooking(bookingId);
        bookingService.assertGuestOrOwner(booking, userId);
        Page<PaymentEntity> page = status != null
                ? paymentRepository.findByBookingIdAndStatus(bookingId, status, pageable)
                : paymentRepository.findByBookingId(bookingId, pageable);
        List<PaymentResponse> content = page.getContent().stream().map(paymentMapper::toResponse).toList();
        return PageResponse.from(page, content);
    }

    @Transactional(readOnly = true)
    public PaymentResponse getPayment(Long paymentId, Long userId) {
        PaymentEntity payment = findPayment(paymentId);
        assertPaymentAccess(payment, userId);
        return paymentMapper.toResponse(payment);
    }

    @Transactional
    public PaymentResponse retry(Long paymentId, Long userId, PaymentRetryRequest request) {
        PaymentEntity old = findPayment(paymentId);
        assertPaymentAccess(old, userId);
        if (old.getStatus() != PaymentStatus.FAILED && old.getStatus() != PaymentStatus.CANCELED) {
            throw new ConflictException("Only failed or canceled payments can be retried");
        }
        BookingEntity booking = old.getBooking();
        if (paymentRepository.existsByBookingIdAndStatus(booking.getId(), PaymentStatus.SUCCESS)) {
            throw new ConflictException("Booking already has a successful payment");
        }
        BigDecimal commission = calculateCommission(booking.getTotalAmount());
        PaymentEntity payment = PaymentEntity.builder()
                .booking(booking)
                .amount(booking.getTotalAmount())
                .commission(commission)
                .status(PaymentStatus.NEW)
                .paymentMethod(request.getPaymentMethod())
                .build();
        payment = paymentRepository.save(payment);
        return applyGatewayResult(payment);
    }

    @Transactional(readOnly = true)
    public PaymentReceiptResponse getReceipt(Long paymentId, Long userId) {
        PaymentEntity payment = findPayment(paymentId);
        assertPaymentAccess(payment, userId);
        if (payment.getStatus() != PaymentStatus.SUCCESS) {
            throw new BusinessException("Receipt is available only for successful payments");
        }
        return paymentMapper.toReceipt(payment);
    }

    private PaymentResponse applyGatewayResult(PaymentEntity payment) {
        PaymentResult result = paymentGateway.process(payment);
        payment.setStatus(result.getStatus());
        payment.setPaymentSystemId(result.getPaymentSystemId());
        payment.setFailureReason(result.getFailureReason());
        if (result.getStatus() == PaymentStatus.SUCCESS) {
            payment.setPaidAt(Instant.now());
            bookingService.markAccepted(payment.getBooking());
        }
        return paymentMapper.toResponse(paymentRepository.save(payment));
    }

    private BigDecimal calculateCommission(BigDecimal amount) {
        int percent = appProperties.getPayment().getCommissionPercent();
        return amount.multiply(BigDecimal.valueOf(percent))
                .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
    }

    private PaymentEntity findPayment(Long paymentId) {
        return paymentRepository.findById(paymentId)
                .orElseThrow(() -> new NotFoundException("Payment not found"));
    }

    private void assertPaymentAccess(PaymentEntity payment, Long userId) {
        bookingService.assertGuestOrOwner(payment.getBooking(), userId);
    }
}
