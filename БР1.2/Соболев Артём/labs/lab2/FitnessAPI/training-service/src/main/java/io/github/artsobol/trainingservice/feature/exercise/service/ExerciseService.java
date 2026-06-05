package io.github.artsobol.trainingservice.feature.exercise.service;

import io.github.artsobol.trainingservice.feature.exercise.dto.request.CreateExerciseRequest;
import io.github.artsobol.trainingservice.feature.exercise.dto.request.UpdateExerciseRequest;
import io.github.artsobol.trainingservice.feature.exercise.dto.response.ExerciseResponse;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Slice;

public interface ExerciseService {

    ExerciseResponse getById(Long id);

    Slice<ExerciseResponse> getAll(Pageable pageable, String name);

    ExerciseResponse create(CreateExerciseRequest request, Long authorId);

    ExerciseResponse update(Long id, UpdateExerciseRequest request);

    ExerciseResponse addVideo(Long id, Long videoId);

    void removeVideo(Long id, Long videoId);

    void deactivate(Long id);
}
