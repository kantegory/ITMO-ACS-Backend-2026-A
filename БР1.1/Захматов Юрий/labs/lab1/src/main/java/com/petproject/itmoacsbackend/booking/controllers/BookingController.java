package com.petproject.itmoacsbackend.booking.controllers;

import com.petproject.itmoacsbackend.booking.dto.BookingCreateRequest;
import com.petproject.itmoacsbackend.booking.dto.BookingResponse;
import com.petproject.itmoacsbackend.booking.service.BookingService;
import com.petproject.itmoacsbackend.users.entities.UserEntity;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/properties/{propertyId}/bookings")
@RequiredArgsConstructor
public class BookingController {

    private final BookingService bookingService;

    @PostMapping
    public ResponseEntity<BookingResponse> createBooking(
            @PathVariable("propertyId") Long propertyId,
            @AuthenticationPrincipal UserEntity user,
            @RequestBody @Valid BookingCreateRequest request
            ) {
        var response = bookingService.createBooking(propertyId, request, user);
        return ResponseEntity.ok(response);
    }


    @GetMapping
    public ResponseEntity<Page<BookingResponse>> getAllBookings(
            @PathVariable("propertyId") Long propertyId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        var response = bookingService.getAllBookings(propertyId, page, size);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}")
    public ResponseEntity<BookingResponse> getBooking(
            @PathVariable("propertyId") Long propertyId,
            @PathVariable("id") Long id,
            @AuthenticationPrincipal UserEntity user
    ) {
        var response = bookingService.getBookingById(propertyId, id, user);
        return ResponseEntity.ok(response);
    }

    // только арендующий
    @PatchMapping("/{id}/cancel")
    public ResponseEntity<BookingResponse> cancelBooking(
            @PathVariable Long id,
            @AuthenticationPrincipal UserEntity user
    ) {
        BookingResponse response = bookingService.cancelBooking(id, user);
        return ResponseEntity.ok(response);
    }

    // только арендодатель
    @PatchMapping("/{id}/confirm")
    public ResponseEntity<BookingResponse> confirmBooking(
            @PathVariable Long id,
            @AuthenticationPrincipal UserEntity user
    ) {
        BookingResponse response = bookingService.confirmBooking(id, user);
        return ResponseEntity.ok(response);
    }
    // только арендодатель
    @PatchMapping("/{id}/reject")
    public ResponseEntity<BookingResponse> rejectBooking(
            @PathVariable Long id,
            @AuthenticationPrincipal UserEntity user
    ) {
        BookingResponse response = bookingService.rejectBooking(id, user);
        return ResponseEntity.ok(response);
    }

    // только арендодатель (только позже даты окончания)
    @PatchMapping("/{id}/complete")
    public ResponseEntity<BookingResponse> completeBooking(
            @PathVariable Long id,
            @AuthenticationPrincipal UserEntity user
    ) {
        BookingResponse response = bookingService.completeBooking(id, user);
        return ResponseEntity.ok(response);
    }
}
