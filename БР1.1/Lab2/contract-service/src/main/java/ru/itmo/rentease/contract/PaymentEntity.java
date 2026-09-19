package ru.itmo.rentease.contract;

import jakarta.persistence.*;
import ru.itmo.rentease.common.PaymentStatus;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "payments")
public class PaymentEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    UUID id;

    @Column(name = "contract_id", nullable = false)
    UUID contractId;

    @Column(nullable = false, precision = 12, scale = 2)
    BigDecimal amount;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    PaymentStatus status = PaymentStatus.pending;

    @Column(name = "created_at", nullable = false)
    OffsetDateTime createdAt = OffsetDateTime.now();
}
