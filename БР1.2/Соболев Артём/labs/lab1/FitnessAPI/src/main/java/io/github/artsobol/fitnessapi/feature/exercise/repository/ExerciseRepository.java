package io.github.artsobol.fitnessapi.feature.exercise.repository;

import io.github.artsobol.fitnessapi.feature.exercise.entity.Exercise;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Slice;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface ExerciseRepository extends JpaRepository<Exercise, Long> {

    Optional<Exercise> findByIdAndIsActiveTrue(Long exerciseId);

    Slice<Exercise> findByIsActiveTrue(Pageable pageable);

    boolean existsByIdAndAuthorId(Long exerciseId, Long authorId);
}
