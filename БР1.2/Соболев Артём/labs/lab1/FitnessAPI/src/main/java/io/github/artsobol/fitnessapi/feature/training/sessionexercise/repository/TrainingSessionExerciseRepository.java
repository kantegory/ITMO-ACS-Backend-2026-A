package io.github.artsobol.fitnessapi.feature.training.sessionexercise.repository;

import io.github.artsobol.fitnessapi.feature.training.sessionexercise.entity.ExerciseStatus;
import io.github.artsobol.fitnessapi.feature.training.sessionexercise.entity.TrainingSessionExercise;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Slice;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface TrainingSessionExerciseRepository extends JpaRepository<TrainingSessionExercise, Long> {

    Slice<TrainingSessionExercise> findByTrainingSessionIdAndTrainingSessionUserId(
            Long trainingSessionId,
            Long userId,
            Pageable pageable
    );

    long countByTrainingSessionUserId(Long userId);

    long countByTrainingSessionUserIdAndExerciseStatus(Long userId, ExerciseStatus exerciseStatus);

    Optional<TrainingSessionExercise> findByIdAndTrainingSessionUserId(Long id, Long userId);
}
