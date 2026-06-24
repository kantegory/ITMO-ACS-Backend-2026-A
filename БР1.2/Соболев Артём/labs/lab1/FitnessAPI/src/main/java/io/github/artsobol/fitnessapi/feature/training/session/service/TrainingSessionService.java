package io.github.artsobol.fitnessapi.feature.training.session.service;

import io.github.artsobol.fitnessapi.feature.training.session.dto.response.TrainingSessionResponse;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Slice;

public interface TrainingSessionService {

    Slice<TrainingSessionResponse> getAllByUser(Long userId, Pageable pageable);

    TrainingSessionResponse getById(Long sessionId, Long userId);

    TrainingSessionResponse create(Long trainingId, Long userId);

    TrainingSessionResponse complete(Long sessionId, Long userId);

    TrainingSessionResponse abandon(Long sessionId, Long userId);
}
