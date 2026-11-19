package com.petproject.reviewsservice.service;

import com.petproject.reviewsservice.dto.PropertyRatingUpdateEvent;
import com.petproject.reviewsservice.dto.ReviewCreateRequest;
import com.petproject.reviewsservice.dto.ReviewResponse;
import com.petproject.reviewsservice.entities.ReviewEntity;
import com.petproject.reviewsservice.feign.PropertyServiceClient;
import com.petproject.reviewsservice.repositories.ReviewRepository;
import com.petproject.reviewsservice.security.JwtPrincipal;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;


@Slf4j
@Service
@RequiredArgsConstructor
public class ReviewService {

    private final ReviewRepository reviewRepository;
    private final PropertyServiceClient propertyServiceClient;
    private final KafkaTemplate<String, Object> kafkaTemplate;


    @Transactional
    public ReviewResponse createReview(Long propertyId, ReviewCreateRequest request, JwtPrincipal user) {
        Boolean propertyPresent = propertyServiceClient.ifExists(propertyId);
        if (!propertyPresent) {
                    throw  new EntityNotFoundException("Property with id " + propertyId + " not found");
        }

        ReviewEntity reviewToCreate = ReviewEntity.builder()
                                                  .rating(request.rating())
                                                  .comment(request.comment())
                                                  .userId(user.userId())
                                                  .propertyId(propertyId).build();
        var savedReview = reviewRepository.save(reviewToCreate);

        var response = mapToResponse(savedReview);

        PropertyRatingUpdateEvent event = PropertyRatingUpdateEvent.builder()
                .propertyId(propertyId)
                .rating(request.rating())
                .build();

        kafkaTemplate.send("property.rating.updated", event);
        log.info("sent rating update event for property {}", propertyId);

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
                             .userId(entity.getUserId())
                             .propertyId(entity.getPropertyId())
                             .comment(entity.getComment())
                             .rating(entity.getRating())
                             .createdAt(entity.getCreatedAt())
                             .build();
    }

    public void deleteById(Long propertyId, Long reviewId , JwtPrincipal user) {
        Boolean propertyPresent = propertyServiceClient.ifExists(propertyId);
        if (!propertyPresent) {
            throw  new EntityNotFoundException("Property with id " + propertyId + " not found");
        }
        ReviewEntity review = reviewRepository.findById(reviewId).orElseThrow(
                () -> new EntityNotFoundException("Review with id " + reviewId + " not found")
        );

        if (!user.userId().equals(review.getUserId())) {
            throw new SecurityException("You are not allowed to delete this review");
        }
        reviewRepository.deleteById(reviewId);

    }
}
