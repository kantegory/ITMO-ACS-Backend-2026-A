package io.github.artsobol.fitnessapi.feature.training.rating.service;

import io.github.artsobol.fitnessapi.feature.training.rating.dto.request.CreateTrainingRatingRequest;
import io.github.artsobol.fitnessapi.feature.training.rating.dto.request.UpdateTrainingRatingRequest;
import io.github.artsobol.fitnessapi.feature.training.rating.dto.response.TrainingRatingResponse;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Slice;

public interface TrainingRatingService {

    Slice<TrainingRatingResponse> getAll(Long trainingId, Pageable pageable);

    TrainingRatingResponse create(Long trainingId, Long userId,  CreateTrainingRatingRequest request);

    TrainingRatingResponse update(Long trainingId, Long userId, UpdateTrainingRatingRequest request);

    void delete(Long trainingId, Long userId);
}
