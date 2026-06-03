package com.petproject.itmoacsbackend.reviews.controllers;

import com.petproject.itmoacsbackend.reviews.dto.ReviewCreateRequest;
import com.petproject.itmoacsbackend.reviews.dto.ReviewResponse;
import com.petproject.itmoacsbackend.reviews.service.ReviewService;
import com.petproject.itmoacsbackend.users.entities.UserEntity;
import jakarta.websocket.server.PathParam;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/properties/{propertyId}/reviews")
@RequiredArgsConstructor
public class ReviewsController {

    private final ReviewService reviewService;


    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteReview(
            @PathVariable("propertyId") Long propertyId,
            @PathVariable("id") Long reviewId,
            @AuthenticationPrincipal UserEntity user
    ) {
        reviewService.deleteById(propertyId, reviewId, user);
        return ResponseEntity.noContent().build();
    }

    @GetMapping
    public ResponseEntity<Page<ReviewResponse>> getAllReviews(
            @PathVariable Long propertyId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        Page<ReviewResponse> response = reviewService.getAllReviews(propertyId, page, size);
        return ResponseEntity.ok(response);
    }

    @PostMapping
    public ResponseEntity<ReviewResponse> createReview(
            @PathVariable("propertyId") Long propertyId,
            @RequestBody ReviewCreateRequest request,
            @AuthenticationPrincipal UserEntity user
    ) {
        ReviewResponse response = reviewService.createReview(propertyId, request, user);
        return ResponseEntity.ok(response);
    }

}
