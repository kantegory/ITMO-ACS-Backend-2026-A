package io.github.artsobol.trainingservice.feature.training.exercise.service;

import io.github.artsobol.common.exception.http.NotFoundException;
import io.github.artsobol.trainingservice.feature.training.exercise.entity.TrainingExercise;
import io.github.artsobol.trainingservice.feature.training.exercise.repository.TrainingExerciseRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
public class TrainingExerciseServiceImpl implements TrainingExerciseFinder {

    private final TrainingExerciseRepository trainingExerciseRepository;

    @Override
    public TrainingExercise findByIdOrThrow(Long id) {
        return trainingExerciseRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("training.exercise.id.not.found", id));
    }
}
