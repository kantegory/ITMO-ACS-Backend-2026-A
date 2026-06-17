package org.renting.rentingservice.repository;

import org.renting.rentingservice.domain.entity.RefreshTokenEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface RefreshTokenRepository extends JpaRepository<RefreshTokenEntity, Long> {

    Optional<RefreshTokenEntity> findByTokenHashAndRevokedAtIsNull(String tokenHash);
}
