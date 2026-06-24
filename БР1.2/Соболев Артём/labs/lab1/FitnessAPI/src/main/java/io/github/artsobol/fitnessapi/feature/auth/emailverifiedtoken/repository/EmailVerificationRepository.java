package io.github.artsobol.fitnessapi.feature.auth.emailverifiedtoken.repository;

import io.github.artsobol.fitnessapi.feature.auth.emailverifiedtoken.entity.EmailVerificationToken;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface EmailVerificationRepository extends JpaRepository<EmailVerificationToken, Long> {

    @Query("""
                select t
                    from EmailVerificationToken t
                        where t.user.id =:userId
                            and  t.revokedAt is null
                            and t.usedAt is null
                            and t.expiresAt > CURRENT_TIMESTAMP
            """)
    Optional<EmailVerificationToken> findActiveTokenByUserId(@Param("userId") Long userId);

    @Query("""
                select t
                    from EmailVerificationToken t
                        where t.tokenHash =:tokenHash
                            and  t.revokedAt is null
                            and t.usedAt is null
                            and t.expiresAt > CURRENT_TIMESTAMP
            """)
    Optional<EmailVerificationToken> findActiveTokenByTokenHash(@Param("tokenHash") String tokenHash);
}
