package io.github.artsobol.progressservice.feature.progress.service;

import io.github.artsobol.progressservice.feature.progress.dto.response.UserProgressResponse;
import io.github.artsobol.progressservice.feature.training.session.entity.TrainingStatus;
import io.github.artsobol.progressservice.feature.training.session.repository.TrainingSessionRepository;
import io.github.artsobol.progressservice.feature.training.sessionexercise.entity.ExerciseStatus;
import io.github.artsobol.progressservice.feature.training.sessionexercise.repository.TrainingSessionExerciseRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
public class ProgressServiceImpl implements ProgressService {

    private final TrainingSessionRepository trainingSessionRepository;
    private final TrainingSessionExerciseRepository trainingSessionExerciseRepository;

    @Override
    @Transactional(readOnly = true)
    public UserProgressResponse getProgress(Long userId) {
        log.debug("Fetching progress userId={}", userId);

        return new UserProgressResponse(
                trainingSessionRepository.countByUserId(userId),
                trainingSessionRepository.countByUserIdAndTrainingStatus(userId, TrainingStatus.IN_PROGRESS),
                trainingSessionRepository.countByUserIdAndTrainingStatus(userId, TrainingStatus.COMPLETED),
                trainingSessionRepository.countByUserIdAndTrainingStatus(userId, TrainingStatus.ABANDONED),
                trainingSessionExerciseRepository.countByTrainingSessionUserId(userId),
                trainingSessionExerciseRepository.countByTrainingSessionUserIdAndExerciseStatus(userId, ExerciseStatus.NOT_STARTED),
                trainingSessionExerciseRepository.countByTrainingSessionUserIdAndExerciseStatus(userId, ExerciseStatus.IN_PROGRESS),
                trainingSessionExerciseRepository.countByTrainingSessionUserIdAndExerciseStatus(userId, ExerciseStatus.COMPLETED),
                trainingSessionExerciseRepository.countByTrainingSessionUserIdAndExerciseStatus(userId, ExerciseStatus.SKIPPED)
        );
    }
}
