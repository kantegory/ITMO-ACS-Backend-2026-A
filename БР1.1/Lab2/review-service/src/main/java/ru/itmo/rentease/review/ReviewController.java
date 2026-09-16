package ru.itmo.rentease.review;

import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import ru.itmo.rentease.common.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1")
public class ReviewController {
    private final ReviewRepository reviews;
    private final InternalHttpClient internal;
    private final String contractServiceUrl;

    public ReviewController(ReviewRepository reviews,
                             InternalHttpClient internal,
                             @Value("${contract-service.url:http://localhost:8084}") String contractServiceUrl) {
        this.reviews = reviews;
        this.internal = internal;
        this.contractServiceUrl = contractServiceUrl;
    }

    @GetMapping("/health")
    ApiDtos.HealthResponse health() {
        return new ApiDtos.HealthResponse("healthy", "review-service");
    }

    @GetMapping("/reviews")
    List<ApiDtos.ReviewResponse> list() {
        return reviews.findByAuthorIdOrderByCreatedAtDesc(SecurityConfig.currentUserId())
                .stream().map(this::response).toList();
    }

    @PostMapping("/reviews")
    @ResponseStatus(HttpStatus.CREATED)
    ApiDtos.ReviewResponse create(@Valid @RequestBody ApiDtos.ReviewRequest request) {
        UUID authorId = SecurityConfig.currentUserId();
        ApiDtos.EligibilityResponse eligibility = internal.get(contractServiceUrl,
                "/internal/contracts/" + request.contractId() + "/review-eligibility?author_id=" + authorId,
                ApiDtos.EligibilityResponse.class);
        if (!eligibility.eligible()) throw AppException.forbidden("Review is not allowed: " + eligibility.reason());
        if (reviews.existsByContractIdAndAuthorId(request.contractId(), authorId)) {
            throw AppException.conflict("Review already exists");
        }
        ReviewEntity review = new ReviewEntity();
        review.contractId = request.contractId();
        review.authorId = authorId;
        review.rating = request.rating();
        review.comment = request.comment();
        return response(reviews.save(review));
    }

    private ApiDtos.ReviewResponse response(ReviewEntity review) {
        return new ApiDtos.ReviewResponse(review.id, review.contractId, review.authorId,
                review.rating, review.comment);
    }
}
