package io.github.artsobol.fitnessapi.feature.auth.passwordresettoken.repository;

import io.github.artsobol.fitnessapi.feature.auth.passwordresettoken.entity.PasswordResetToken;
import io.github.artsobol.fitnessapi.feature.user.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface PasswordResetTokenRepository extends JpaRepository<PasswordResetToken, Long> {

    @Query("""
                select t
                    from PasswordResetToken t
                        where t.user.id =:userId
                            and  t.revokedAt is null
                            and t.usedAt is null
                            and t.expiresAt > CURRENT_TIMESTAMP
            """)
    Optional<PasswordResetToken> findActiveTokenByUserId(@Param("userId") Long userId);

    @Query("""
                select t
                    from PasswordResetToken t
                        where t.tokenHash =:tokenHash
                            and  t.revokedAt is null
                            and t.usedAt is null
                            and t.expiresAt > CURRENT_TIMESTAMP
            """)
    Optional<PasswordResetToken> findActiveTokenByTokenHash(@Param("tokenHash") String tokenHash);
}
