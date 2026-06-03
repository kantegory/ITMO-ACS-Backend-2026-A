package com.petproject.itmoacsbackend.reviews.service;

import com.petproject.itmoacsbackend.auth.enums.GlobalRole;
import com.petproject.itmoacsbackend.property.entities.PropertyEntity;
import com.petproject.itmoacsbackend.property.repositories.PropertyRepository;
import com.petproject.itmoacsbackend.reviews.dto.ReviewCreateRequest;
import com.petproject.itmoacsbackend.reviews.dto.ReviewResponse;
import com.petproject.itmoacsbackend.reviews.entities.ReviewEntity;
import com.petproject.itmoacsbackend.reviews.repositories.ReviewRepository;
import com.petproject.itmoacsbackend.users.entities.UserEntity;
import com.petproject.itmoacsbackend.users.repositories.UserRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;

@Service
@RequiredArgsConstructor
public class ReviewService {

    private final PropertyRepository propertyRepository;
    private final UserRepository userRepository;
    private final ReviewRepository reviewRepository;


    // TODO: Добавить проверку на букинг
    @Transactional
    public ReviewResponse createReview(Long propertyId, ReviewCreateRequest request, UserEntity user) {
        PropertyEntity property = propertyRepository.findById(propertyId).orElseThrow(
                () -> new EntityNotFoundException("Property with id " + propertyId + " not found")
        );

        // TODO: Add check for userId and Role

        ReviewEntity reviewToCreate = ReviewEntity.builder()
                .rating(request.rating())
                .comment(request.comment())
                .userId(user)
                .propertyId(property).build();
        var savedReview = reviewRepository.save(reviewToCreate);

        var response = mapToResponse(savedReview);

        property.setTotalReviews(property.getTotalReviews() + 1);
        property.setRatingSum(property.getRatingSum() + response.rating());
        BigDecimal newAvgRating = new BigDecimal(property.getRatingSum()/property.getTotalReviews());
        newAvgRating = newAvgRating.setScale(2, RoundingMode.HALF_UP);
        Double avgRating = newAvgRating.doubleValue();
        property.setAvgRating(avgRating);
        propertyRepository.save(property);
        return response;

    }

    public Page<ReviewResponse> getAllReviews(Long propertyId, int page, int size) {
        Pageable pageable = PageRequest.of(page, size,  Sort.by("createdAt"));
        Page<ReviewEntity> response = reviewRepository.findAll(pageable);
        return response.map(this::mapToResponse);

    }

    private ReviewResponse mapToResponse(ReviewEntity entity) {
        return ReviewResponse.builder()
                             .id(entity.getId())
                             .userId(entity.getUserId().getId())
                             .propertyId(entity.getPropertyId().getId())
                             .comment(entity.getComment())
                             .rating(entity.getRating())
                             .createdAt(entity.getCreatedAt())
                             .build();
    }

    public void deleteById(Long propertyId, Long reviewId , UserEntity user) {
        PropertyEntity property = propertyRepository.findById(propertyId).orElseThrow(
                () -> new EntityNotFoundException("Property with id " + propertyId + " not found")
        );
        ReviewEntity review = reviewRepository.findById(reviewId).orElseThrow(
                () -> new EntityNotFoundException("Review with id " + reviewId + " not found")
        );

        if (!user.getId().equals(review.getUserId().getId()) && !user.getGlobalRole().equals(GlobalRole.ADMIN)) {
            throw new SecurityException("You are not allowed to delete this review");
        }
        reviewRepository.deleteById(reviewId);

    }
}
