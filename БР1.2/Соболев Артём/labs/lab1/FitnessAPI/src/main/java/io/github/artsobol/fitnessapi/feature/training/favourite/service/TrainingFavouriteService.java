package io.github.artsobol.fitnessapi.feature.training.favourite.service;

import io.github.artsobol.fitnessapi.feature.training.favourite.dto.response.TrainingFavouriteResponse;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Slice;

public interface TrainingFavouriteService {

    TrainingFavouriteResponse create(Long userId, Long trainingId);

    Slice<TrainingFavouriteResponse> getAll(Long userId, Pageable pageable);

    void delete(Long userId, Long trainingId);
}
