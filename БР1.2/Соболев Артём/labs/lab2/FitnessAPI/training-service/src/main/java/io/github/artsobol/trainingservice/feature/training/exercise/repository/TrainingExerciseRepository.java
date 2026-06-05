package io.github.artsobol.trainingservice.feature.training.exercise.repository;

import io.github.artsobol.trainingservice.feature.training.exercise.entity.TrainingExercise;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TrainingExerciseRepository extends JpaRepository<TrainingExercise, Long> {

    boolean existsByIdAndTrainingId(Long id, Long trainingId);
}
