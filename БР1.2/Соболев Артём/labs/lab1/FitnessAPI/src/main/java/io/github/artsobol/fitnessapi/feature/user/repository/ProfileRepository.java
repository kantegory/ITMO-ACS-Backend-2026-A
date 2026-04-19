package io.github.artsobol.fitnessapi.feature.user.repository;

import io.github.artsobol.fitnessapi.feature.user.entity.Profile;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface ProfileRepository extends JpaRepository<Profile, Long> {

    Optional<Profile> findByUserId(Long userId);

    boolean existsByUserId(Long userId);
}
