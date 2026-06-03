package com.petproject.itmoacsbackend.auth.repositories;

import com.petproject.itmoacsbackend.auth.entities.RefreshTokenEntity;
import com.petproject.itmoacsbackend.users.entities.UserEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface RefreshTokenRepository extends JpaRepository<RefreshTokenEntity, Long> {
    Optional<RefreshTokenEntity> findByToken(String refreshToken);
    void deleteByUser(UserEntity user);
}
