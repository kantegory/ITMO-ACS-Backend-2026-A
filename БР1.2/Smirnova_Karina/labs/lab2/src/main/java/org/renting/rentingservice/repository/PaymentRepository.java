package org.renting.rentingservice.repository;

import org.renting.rentingservice.domain.entity.PaymentEntity;
import org.renting.rentingservice.domain.enums.PaymentStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface PaymentRepository extends JpaRepository<PaymentEntity, Long> {

    Page<PaymentEntity> findByBookingIdAndStatus(Long bookingId, PaymentStatus status, Pageable pageable);

    Page<PaymentEntity> findByBookingId(Long bookingId, Pageable pageable);

    boolean existsByBookingIdAndStatus(Long bookingId, PaymentStatus status);

    Optional<PaymentEntity> findFirstByBookingIdAndStatusOrderByCreatedAtDesc(Long bookingId, PaymentStatus status);
}
