package ru.itmo.rentease.review;

import jakarta.persistence.*;

import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "reviews", uniqueConstraints = @UniqueConstraint(name = "uq_review_author_contract",
        columnNames = {"contract_id", "author_id"}))
public class ReviewEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    UUID id;

    @Column(name = "contract_id", nullable = false)
    UUID contractId;

    @Column(name = "author_id", nullable = false)
    UUID authorId;

    @Column(nullable = false)
    int rating;

    @Column(nullable = false, length = 4000)
    String comment;

    @Column(name = "created_at", nullable = false)
    OffsetDateTime createdAt = OffsetDateTime.now();
}
