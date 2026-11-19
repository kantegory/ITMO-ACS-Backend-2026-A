package com.petproject.authservice.repositories;

import com.petproject.authservice.entities.RefreshTokenEntity;
import com.petproject.authservice.entities.UserEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface RefreshTokenRepository extends JpaRepository<RefreshTokenEntity, Long> {
    Optional<RefreshTokenEntity> findByToken(String refreshToken);
    void deleteByUser(UserEntity user);
}
