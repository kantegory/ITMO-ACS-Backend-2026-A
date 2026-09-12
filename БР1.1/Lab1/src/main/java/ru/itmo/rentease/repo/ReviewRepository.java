package ru.itmo.rentease.repo;

import org.springframework.data.jpa.repository.JpaRepository;
import ru.itmo.rentease.Domain.Review;

import java.util.UUID;

public interface ReviewRepository extends JpaRepository<Review, UUID> {
    boolean existsByContractIdAndAuthorId(UUID contractId, UUID authorId);
}
