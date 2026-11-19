package com.petproject.authservice.controllers;


import com.petproject.authservice.dto.UserResponse;
import com.petproject.authservice.dto.UserShortResponse;
import com.petproject.authservice.dto.UserUpdateRequest;
import com.petproject.authservice.entities.UserEntity;
import com.petproject.authservice.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/users/me")
public class UserController {

    private final UserService userService;
//    private final PropertyService propertyService;
//    private final BookingService bookingService;


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

    @GetMapping("/{user_id}")
    public ResponseEntity<UserShortResponse> getUserById(
            @PathVariable("user_id") Long id
    ) {
        UserShortResponse response = userService.getShortInfoUserById(id);
        return ResponseEntity.ok(response);
    }


    @PostMapping("/makeAdmin/{password}")
    public ResponseEntity<String> makeAdmin(
            @PathVariable String password,
            @AuthenticationPrincipal UserEntity user
    ) {
        return ResponseEntity.status(HttpStatus.OK).body(userService.makeAdmin(user, password));
    }



//    @GetMapping("/bookings")
//    public ResponseEntity<Page<BookingResponse>> getBookings(
//            @RequestParam(defaultValue = "0") int page,
//            @RequestParam(defaultValue = "20") int size,
//            @AuthenticationPrincipal UserEntity user
//    ) {
//        return ResponseEntity.ok(bookingService.getAllUserBookings(user,page,size));
//    }
//
//    @GetMapping("/properties")
//    public ResponseEntity<Page<PropertyResponse>> getProperties(
//            @RequestParam(defaultValue = "0") int page,
//            @RequestParam(defaultValue = "20") int size,
//            @AuthenticationPrincipal UserEntity user
//    ) {
//        return ResponseEntity.ok(propertyService.getAllUserProperties(user, page, size));
//    }

}
