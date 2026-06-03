package com.petproject.reviewsservice.controllers;

import com.petproject.reviewsservice.dto.ReviewCreateRequest;
import com.petproject.reviewsservice.dto.ReviewResponse;
import com.petproject.reviewsservice.security.JwtPrincipal;
import com.petproject.reviewsservice.service.ReviewService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
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
            @AuthenticationPrincipal JwtPrincipal user
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
            @AuthenticationPrincipal JwtPrincipal user
    ) {
        ReviewResponse response = reviewService.createReview(propertyId, request, user);
        return ResponseEntity.ok(response);
    }

}
