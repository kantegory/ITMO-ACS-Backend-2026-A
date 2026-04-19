package io.github.artsobol.fitnessapi.feature.training.type.repository;

import io.github.artsobol.fitnessapi.feature.training.type.entity.Type;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface TypeRepository extends JpaRepository<Type, Long> {

    Optional<Type> findBySlug(String slug);

    boolean existsBySlug(String slug);
}
