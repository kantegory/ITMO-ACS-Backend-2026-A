package io.github.artsobol.fitnessapi.feature.training.training.repository;

import io.github.artsobol.fitnessapi.feature.training.training.entity.Training;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Slice;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface TrainingRepository extends JpaRepository<Training, Long> {

    Optional<Training> findByIdAndIsActiveTrue(Long trainingId);

    Slice<Training> findByIsActiveTrue(Pageable pageable);

    boolean existsByIdAndAuthorId(Long trainingId, Long authorId);
}
