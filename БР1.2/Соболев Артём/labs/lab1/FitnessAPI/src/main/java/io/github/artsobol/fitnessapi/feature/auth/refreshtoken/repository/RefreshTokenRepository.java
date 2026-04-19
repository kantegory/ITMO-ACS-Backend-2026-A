package io.github.artsobol.fitnessapi.feature.auth.refreshtoken.repository;

import io.github.artsobol.fitnessapi.feature.auth.refreshtoken.entity.RefreshToken;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface RefreshTokenRepository extends JpaRepository<RefreshToken, Long> {

    Optional<RefreshToken> findByTokenHash(String tokenHash);

    @Query("""
            select t
            from RefreshToken t
            where t.user.id=:userId
            and t.sessionId=:sessionId
            and t.expiresAt > CURRENT_TIMESTAMP
            and t.revokedAt is null
            """)
    List<RefreshToken> findActiveByUserIdAndSessionId(@Param("userId") Long userId, @Param("sessionId") UUID sessionId);

    @Query("""
            select count(*)
            from RefreshToken t
            where t.user.id=:userId
            and t.sessionId=:sessionId
            and t.expiresAt > CURRENT_TIMESTAMP
            and t.revokedAt is null
            """)
    long countActiveByUserIdAndSessionId(@Param("userId") Long userId, @Param("sessionId") UUID sessionId);

    @Query("""
                select t
                    from RefreshToken t
                        where t.user.id =:userId
                            and t.revokedAt is null
                                and t.expiresAt > CURRENT_TIMESTAMP
            """)
    List<RefreshToken> findActiveByUserId(@Param("userId") UUID userId);

    @Query("""
            select count(*)
            from RefreshToken t
            where t.user.id=:userId
            and t.expiresAt> CURRENT_TIMESTAMP
            and t.revokedAt is null
            """)
    long countActiveSessions(@Param("userId") Long userId);

    @Query("""
                select t
                    from RefreshToken t
                        where t.user.id=:userId
                            and t.expiresAt > CURRENT_TIMESTAMP
                                and t.revokedAt is null
                                         order by t.lastUsedAt asc
            """)
    List<RefreshToken> findOldestActiveSessions(@Param("userId") Long userId, Pageable pageable);

    @Modifying
    @Query("""
                    update RefreshToken t
                                set t.revokedAt = CURRENT_TIMESTAMP
                    where t.user.id=:userId
                    and t.sessionId=:sessionId
                    and t.expiresAt > CURRENT_TIMESTAMP
                    and t.revokedAt is null
            """)
   void revokeSessionByUserIdAndSessionId(@Param("userId") Long userId,@Param("sessionId") UUID sessionId);
}
