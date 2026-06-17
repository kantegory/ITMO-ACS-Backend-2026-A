package org.renting.rentingservice.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.renting.rentingservice.domain.enums.BookingStatus;
import org.renting.rentingservice.dto.booking.BookingResponse;
import org.renting.rentingservice.dto.booking.CreateBookingRequest;
import org.renting.rentingservice.dto.common.PageResponse;
import org.renting.rentingservice.security.SecurityUtils;
import org.renting.rentingservice.service.BookingService;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.context.annotation.Profile;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
@Profile("property")
@RequestMapping("/bookings")
@Tag(name = "Bookings", description = "Бронирования жилья")
public class BookingController {

    private final BookingService bookingService;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Создать бронирование", description = "Создаёт новое бронирование для выбранного объявления")
    public BookingResponse create(@Valid @RequestBody CreateBookingRequest request) {
        return bookingService.create(SecurityUtils.currentUserId(), request);
    }

    @GetMapping
    @Operation(summary = "Список бронирований", description = "Возвращает бронирования текущего гостя с фильтром по статусу")
    public PageResponse<BookingResponse> list(
            @RequestParam(required = false) BookingStatus status,
            @PageableDefault(size = 20) Pageable pageable) {
        return bookingService.listForGuest(SecurityUtils.currentUserId(), status, pageable);
    }

    @GetMapping("/{bookingId}")
    @Operation(summary = "Детали бронирования", description = "Возвращает бронирование по идентификатору")
    public BookingResponse get(@PathVariable Long bookingId) {
        return bookingService.get(bookingId, SecurityUtils.currentUserId());
    }

    @PostMapping("/{bookingId}/cancel")
    @Operation(summary = "Отменить бронирование", description = "Отменяет бронирование текущим пользователем")
    public BookingResponse cancel(@PathVariable Long bookingId) {
        return bookingService.cancel(bookingId, SecurityUtils.currentUserId());
    }

    @PostMapping("/{bookingId}/complete")
    @Operation(summary = "Завершить бронирование", description = "Помечает бронирование как завершённое")
    public BookingResponse complete(@PathVariable Long bookingId) {
        return bookingService.complete(bookingId, SecurityUtils.currentUserId());
    }
}
