package io.github.artsobol.fitnessapi.feature.training.sessionexercise.service;

import io.github.artsobol.fitnessapi.exception.http.BadRequestException;
import io.github.artsobol.fitnessapi.exception.http.NotFoundException;
import io.github.artsobol.fitnessapi.feature.training.session.entity.TrainingSession;
import io.github.artsobol.fitnessapi.feature.training.session.entity.TrainingStatus;
import io.github.artsobol.fitnessapi.feature.training.session.service.TrainingSessionFinder;
import io.github.artsobol.fitnessapi.feature.training.sessionexercise.dto.response.TrainingSessionExerciseResponse;
import io.github.artsobol.fitnessapi.feature.training.sessionexercise.entity.TrainingSessionExercise;
import io.github.artsobol.fitnessapi.feature.training.sessionexercise.mapper.TrainingSessionExerciseMapper;
import io.github.artsobol.fitnessapi.feature.training.sessionexercise.repository.TrainingSessionExerciseRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Slice;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
public class TrainingSessionExerciseServiceImpl implements TrainingSessionExerciseService {

    private final TrainingSessionExerciseRepository trainingSessionExerciseRepository;
    private final TrainingSessionExerciseMapper trainingSessionExerciseMapper;
    private final TrainingSessionFinder trainingSessionFinder;

    @Override
    @Transactional(readOnly = true)
    @PreAuthorize("#userId == authentication.principal.userId")
    public Slice<TrainingSessionExerciseResponse> getAllByTrainingSession(
            Long trainingSessionId,
            Long userId,
            Pageable pageable
    ) {
        trainingSessionFinder.findByIdOrThrow(trainingSessionId, userId);

        log.debug(
                "Fetching training session trainingSessionId={} userId={} page={} size={} sort={}",
                trainingSessionId,
                userId,
                pageable.getPageNumber(),
                pageable.getPageSize(),
                pageable.getSort()
        );
        return trainingSessionExerciseRepository.findByTrainingSessionIdAndTrainingSessionUserId(
                trainingSessionId,
                userId,
                pageable
        ).map(trainingSessionExerciseMapper::toResponse);
    }

    @Override
    @Transactional(readOnly = true)
    @PreAuthorize("#userId == authentication.principal.userId")
    public TrainingSessionExerciseResponse getById(Long trainingSessionExerciseId, Long userId) {
        return trainingSessionExerciseMapper.toResponse(findByIdOrThrow(trainingSessionExerciseId, userId));
    }

    @Override
    @Transactional
    @PreAuthorize("#userId == authentication.principal.userId")
    public TrainingSessionExerciseResponse start(Long trainingSessionExerciseId, Long userId) {
        log.info(
                "Starting training session exercise trainingSessionExerciseId={} userId={}",
                trainingSessionExerciseId,
                userId
        );
        TrainingSessionExercise entity = findByIdOrThrow(trainingSessionExerciseId, userId);

        ensureSessionInProgress(entity.getTrainingSession());
        ensureExerciseNotFinished(entity);
        entity.start();

        log.info(
                "Training session exercise started trainingSessionExerciseId={} userId={}",
                trainingSessionExerciseId,
                userId
        );
        return trainingSessionExerciseMapper.toResponse(entity);
    }

    @Override
    @Transactional
    @PreAuthorize("#userId == authentication.principal.userId")
    public TrainingSessionExerciseResponse complete(Long trainingSessionExerciseId, Long userId) {
        log.info(
                "Completing training session exercise trainingSessionExerciseId={} userId={}",
                trainingSessionExerciseId,
                userId
        );
        TrainingSessionExercise entity = findByIdOrThrow(trainingSessionExerciseId, userId);

        ensureSessionInProgress(entity.getTrainingSession());
        ensureExerciseNotFinished(entity);
        entity.complete();

        log.info(
                "Training session exercise completed trainingSessionExerciseId={} userId={}",
                trainingSessionExerciseId,
                userId
        );
        return trainingSessionExerciseMapper.toResponse(entity);
    }

    @Override
    @Transactional
    @PreAuthorize("#userId == authentication.principal.userId")
    public TrainingSessionExerciseResponse skip(Long trainingSessionExerciseId, Long userId) {
        log.info(
                "Skipping training session exercise trainingSessionExerciseId={} userId={}",
                trainingSessionExerciseId,
                userId
        );
        TrainingSessionExercise entity = findByIdOrThrow(trainingSessionExerciseId, userId);

        ensureSessionInProgress(entity.getTrainingSession());
        ensureExerciseNotFinished(entity);
        entity.skip();

        log.info(
                "Training session exercise skipped trainingSessionExerciseId={} userId={}",
                trainingSessionExerciseId,
                userId
        );
        return trainingSessionExerciseMapper.toResponse(entity);
    }

    private TrainingSessionExercise findByIdOrThrow(Long trainingSessionExerciseId, Long userId) {
        return trainingSessionExerciseRepository.findByIdAndTrainingSessionUserId(trainingSessionExerciseId, userId)
                .orElseThrow(() -> new NotFoundException("{training.session.exercise.id.not.found}", trainingSessionExerciseId));
    }

    private void ensureSessionInProgress(TrainingSession trainingSession) {
        if (trainingSession.getTrainingStatus() != TrainingStatus.IN_PROGRESS) {
            throw new BadRequestException("{training.session.already.finished}", trainingSession.getId());
        }
    }

    private void ensureExerciseNotFinished(TrainingSessionExercise entity) {
        if (entity.isFinished()) {
            throw new BadRequestException("{training.session.exercise.already.finished}", entity.getId());
        }
    }
}
