package com.petproject.itmoacsbackend.users.controllers;

import com.petproject.itmoacsbackend.booking.dto.BookingResponse;
import com.petproject.itmoacsbackend.booking.entities.BookingEntity;
import com.petproject.itmoacsbackend.booking.repositories.BookingRepository;
import com.petproject.itmoacsbackend.booking.service.BookingService;
import com.petproject.itmoacsbackend.property.dto.PropertyResponse;
import com.petproject.itmoacsbackend.property.repositories.PropertyRepository;
import com.petproject.itmoacsbackend.property.service.PropertyService;
import com.petproject.itmoacsbackend.users.dto.UserResponse;
import com.petproject.itmoacsbackend.users.dto.UserUpdateRequest;
import com.petproject.itmoacsbackend.users.entities.UserEntity;
import com.petproject.itmoacsbackend.users.repositories.UserRepository;
import com.petproject.itmoacsbackend.users.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/users/me")
public class UserController {

    private final UserService userService;
    private final PropertyService propertyService;
    private final BookingService bookingService;


    @GetMapping
    public ResponseEntity<UserResponse> getCurrentUser(
            @AuthenticationPrincipal UserEntity user
    ) {
        UserResponse response = userService.getCurrentUser(user);
        return ResponseEntity.ok(response);
    }

    @PatchMapping
    public ResponseEntity<UserResponse> updateCurrentUser(
            @AuthenticationPrincipal UserEntity user,
            @Valid @RequestBody UserUpdateRequest request
    ) {
        UserResponse response = userService.updateUser(request, user);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/bookings")
    public ResponseEntity<Page<BookingResponse>> getBookings(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @AuthenticationPrincipal UserEntity user
    ) {
        return ResponseEntity.ok(bookingService.getAllUserBookings(user,page,size));
    }

    @GetMapping("/properties")
    public ResponseEntity<Page<PropertyResponse>> getProperties(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @AuthenticationPrincipal UserEntity user
    ) {
        return ResponseEntity.ok(propertyService.getAllUserProperties(user, page, size));
    }

}
