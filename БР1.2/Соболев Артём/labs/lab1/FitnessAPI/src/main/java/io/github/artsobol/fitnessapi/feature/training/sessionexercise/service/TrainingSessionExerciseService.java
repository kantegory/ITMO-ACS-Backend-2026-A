package io.github.artsobol.fitnessapi.feature.training.sessionexercise.service;

import io.github.artsobol.fitnessapi.feature.training.sessionexercise.dto.response.TrainingSessionExerciseResponse;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Slice;

public interface TrainingSessionExerciseService {

    Slice<TrainingSessionExerciseResponse> getAllByTrainingSession(Long trainingSessionId, Long userId, Pageable pageable);

    TrainingSessionExerciseResponse getById(Long trainingSessionExerciseId, Long userId);

    TrainingSessionExerciseResponse start(Long trainingSessionExerciseId, Long userId);

    TrainingSessionExerciseResponse complete(Long trainingSessionExerciseId, Long userId);

    TrainingSessionExerciseResponse skip(Long trainingSessionExerciseId, Long userId);
}
