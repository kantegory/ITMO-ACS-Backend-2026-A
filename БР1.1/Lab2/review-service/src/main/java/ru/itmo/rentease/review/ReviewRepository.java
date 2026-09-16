package ru.itmo.rentease.review;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface ReviewRepository extends JpaRepository<ReviewEntity, UUID> {
    boolean existsByContractIdAndAuthorId(UUID contractId, UUID authorId);
    List<ReviewEntity> findByAuthorIdOrderByCreatedAtDesc(UUID authorId);
}
