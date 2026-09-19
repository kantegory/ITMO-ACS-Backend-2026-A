package ru.itmo.rentease;

import jakarta.validation.Valid;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import ru.itmo.rentease.Domain.*;
import ru.itmo.rentease.repo.AccountRepository;
import ru.itmo.rentease.repo.RentalContractRepository;
import ru.itmo.rentease.repo.ReviewRepository;

import static ru.itmo.rentease.ApiDtos.*;

@RestController
@RequestMapping("/api/v1/reviews")
@SecurityRequirement(name = "bearerAuth")
public class ReviewController {
    private final ReviewRepository reviews;
    private final RentalContractRepository contracts;
    private final AccountRepository accounts;

    public ReviewController(ReviewRepository reviews, RentalContractRepository contracts, AccountRepository accounts) {
        this.reviews = reviews;
        this.contracts = contracts;
        this.accounts = accounts;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    ReviewResponse create(@Valid @RequestBody ReviewRequest request) {
        Account author = accounts.findById(SecurityConfig.currentUserId()).orElseThrow(() -> AppException.notFound("User not found"));
        RentalContract contract = contracts.findById(request.contractId()).orElseThrow(() -> AppException.notFound("Contract not found"));
        boolean participant = contract.booking.tenant.id.equals(author.id) || contract.booking.property.landlord.id.equals(author.id);
        if (!participant && author.role.name != Role.admin) {
            throw AppException.forbidden("Only contract participants can leave a review");
        }
        if (reviews.existsByContractIdAndAuthorId(contract.id, author.id)) {
            throw AppException.conflict("Review already exists");
        }
        Review review = new Review();
        review.contract = contract;
        review.author = author;
        review.rating = request.rating();
        review.comment = request.comment();
        return ReviewResponse.from(reviews.save(review));
    }
}
