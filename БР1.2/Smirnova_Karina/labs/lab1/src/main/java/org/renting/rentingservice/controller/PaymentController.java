package org.renting.rentingservice.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.renting.rentingservice.domain.enums.PaymentStatus;
import org.renting.rentingservice.dto.common.PageResponse;
import org.renting.rentingservice.dto.payment.*;
import org.renting.rentingservice.security.SecurityUtils;
import org.renting.rentingservice.service.PaymentService;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
@Tag(name = "Payments", description = "Оплаты и чеки")
public class PaymentController {

    private final PaymentService paymentService;

    @PostMapping("/bookings/{bookingId}/payments")
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Создать оплату", description = "Инициирует оплату по бронированию и обрабатывает её через mock gateway")
    public PaymentResponse createPayment(
            @PathVariable Long bookingId,
            @Valid @RequestBody CreatePaymentRequest request) {
        return paymentService.createPayment(bookingId, SecurityUtils.currentUserId(), request);
    }

    @GetMapping("/bookings/{bookingId}/payments")
    @Operation(summary = "Список оплат", description = "Возвращает оплаты по бронированию с фильтром по статусу")
    public PageResponse<PaymentResponse> listPayments(
            @PathVariable Long bookingId,
            @RequestParam(required = false) PaymentStatus status,
            @PageableDefault(size = 20) Pageable pageable) {
        return paymentService.listByBooking(bookingId, SecurityUtils.currentUserId(), status, pageable);
    }

    @GetMapping("/payments/{paymentId}")
    @Operation(summary = "Детали оплаты", description = "Возвращает информацию об оплате по идентификатору")
    public PaymentResponse getPayment(@PathVariable Long paymentId) {
        return paymentService.getPayment(paymentId, SecurityUtils.currentUserId());
    }

    @PostMapping("/payments/{paymentId}/retry")
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Повторить оплату", description = "Создаёт новую попытку оплаты после ошибки или отмены")
    public PaymentResponse retry(
            @PathVariable Long paymentId,
            @Valid @RequestBody PaymentRetryRequest request) {
        return paymentService.retry(paymentId, SecurityUtils.currentUserId(), request);
    }

    @GetMapping("/payments/{paymentId}/receipt")
    @Operation(summary = "Получить чек", description = "Возвращает чек только для успешной оплаты")
    public PaymentReceiptResponse getReceipt(@PathVariable Long paymentId) {
        return paymentService.getReceipt(paymentId, SecurityUtils.currentUserId());
    }
}
