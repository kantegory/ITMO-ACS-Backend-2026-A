package org.renting.rentingservice.repository;

import org.renting.rentingservice.domain.entity.UserEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.Optional;

public interface UserRepository extends JpaRepository<UserEntity, Long> {

    Optional<UserEntity> findByEmail(String email);

    boolean existsByEmail(String email);

    @Modifying
    @Query(value = """
            INSERT INTO users (id, username, email, password_hash, phone, verified, created_at)
            VALUES (:id, :username, :email, :passwordHash, :phone, :verified, :createdAt)
            ON CONFLICT (id) DO UPDATE SET
                username = EXCLUDED.username,
                email = EXCLUDED.email,
                password_hash = EXCLUDED.password_hash,
                phone = EXCLUDED.phone,
                verified = EXCLUDED.verified,
                created_at = EXCLUDED.created_at
            """, nativeQuery = true)
    void upsertShadowUser(
            @Param("id") Long id,
            @Param("username") String username,
            @Param("email") String email,
            @Param("passwordHash") String passwordHash,
            @Param("phone") String phone,
            @Param("verified") boolean verified,
            @Param("createdAt") Instant createdAt
    );
}
