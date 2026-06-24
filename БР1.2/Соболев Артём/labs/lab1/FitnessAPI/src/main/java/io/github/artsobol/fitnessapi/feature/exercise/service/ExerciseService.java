package io.github.artsobol.fitnessapi.feature.exercise.service;

import io.github.artsobol.fitnessapi.feature.exercise.dto.request.CreateExerciseRequest;
import io.github.artsobol.fitnessapi.feature.exercise.dto.request.UpdateExerciseRequest;
import io.github.artsobol.fitnessapi.feature.exercise.dto.response.ExerciseResponse;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Slice;

import java.util.List;

public interface ExerciseService {

    ExerciseResponse getById(Long id);

    Slice<ExerciseResponse> getAll(Pageable pageable);

    ExerciseResponse create(CreateExerciseRequest request, Long authorId);

    ExerciseResponse update(Long id, UpdateExerciseRequest request);

    ExerciseResponse addVideo(Long id, Long videoId);

    void removeVideo(Long id, Long videoId);

    void deactivate(Long id);
}
