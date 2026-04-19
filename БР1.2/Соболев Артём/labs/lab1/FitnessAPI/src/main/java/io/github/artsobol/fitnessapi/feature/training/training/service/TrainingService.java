package io.github.artsobol.fitnessapi.feature.training.training.service;

import io.github.artsobol.fitnessapi.feature.training.training.dto.request.CreateTrainingRequest;
import io.github.artsobol.fitnessapi.feature.training.training.dto.request.UpdateTrainingRequest;
import io.github.artsobol.fitnessapi.feature.training.training.dto.response.TrainingResponse;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Slice;

public interface TrainingService {

    TrainingResponse getById(Long id);

    Slice<TrainingResponse> getAll(Pageable pageable);

    TrainingResponse create(CreateTrainingRequest request, Long authorId);

    TrainingResponse update(UpdateTrainingRequest request, Long trainingId);

    TrainingResponse addExercise(Long trainingId, Long trainingExerciseId);

    void removeExercise(Long trainingId, Long trainingExerciseId);

    TrainingResponse addType(Long trainingId, String typeSlug);

    void removeType(Long trainingId, String typeSlug);

    TrainingResponse addTag(Long trainingId, String tagSlug);

    void removeTag(Long trainingId, String tagSlug);

    void deactivate(Long trainingId);
}
