package org.renting.rentingservice.repository;

import org.renting.rentingservice.domain.entity.EmailVerificationTokenEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface EmailVerificationTokenRepository extends JpaRepository<EmailVerificationTokenEntity, Long> {

    Optional<EmailVerificationTokenEntity> findByTokenHashAndUsedAtIsNull(String tokenHash);
}
