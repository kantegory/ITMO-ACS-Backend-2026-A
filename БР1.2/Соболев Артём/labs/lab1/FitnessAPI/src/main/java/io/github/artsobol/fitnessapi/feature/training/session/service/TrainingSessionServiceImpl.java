package io.github.artsobol.fitnessapi.feature.training.session.service;

import io.github.artsobol.fitnessapi.exception.http.BadRequestException;
import io.github.artsobol.fitnessapi.exception.http.NotFoundException;
import io.github.artsobol.fitnessapi.feature.training.session.dto.response.TrainingSessionResponse;
import io.github.artsobol.fitnessapi.feature.training.session.entity.TrainingSession;
import io.github.artsobol.fitnessapi.feature.training.session.entity.TrainingStatus;
import io.github.artsobol.fitnessapi.feature.training.session.mapper.TrainingSessionMapper;
import io.github.artsobol.fitnessapi.feature.training.session.repository.TrainingSessionRepository;
import io.github.artsobol.fitnessapi.feature.training.training.entity.Training;
import io.github.artsobol.fitnessapi.feature.training.training.service.TrainingFinder;
import io.github.artsobol.fitnessapi.feature.user.entity.User;
import io.github.artsobol.fitnessapi.feature.user.service.UserFinder;
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
public class TrainingSessionServiceImpl implements TrainingSessionService, TrainingSessionFinder {

    private final TrainingSessionRepository trainingSessionRepository;
    private final TrainingSessionMapper trainingSessionMapper;
    private final UserFinder userFinder;
    private final TrainingFinder trainingFinder;

    @Override
    @Transactional(readOnly = true)
    @PreAuthorize("#userId == authentication.principal.userId")
    public Slice<TrainingSessionResponse> getAllByUser(Long userId, Pageable pageable) {
        log.debug(
                "Fetching training sessions userId={} page={} size={} sort={}",
                userId,
                pageable.getPageNumber(),
                pageable.getPageSize(),
                pageable.getSort()
        );
        return trainingSessionRepository.findByUserId(userId, pageable).map(trainingSessionMapper::toResponse);
    }

    @Override
    @Transactional(readOnly = true)
    @PreAuthorize("#userId == authentication.principal.userId")
    public TrainingSessionResponse getById(Long sessionId, Long userId) {
        return trainingSessionMapper.toResponse(findByIdOrThrow(sessionId, userId));
    }

    @Override
    @Transactional
    @PreAuthorize("#userId == authentication.principal.userId")
    public TrainingSessionResponse create(Long trainingId, Long userId) {
        log.info("Creating training session trainingId={} userId={}", trainingId, userId);
        ensureNoActiveSession(trainingId, userId);

        User user = userFinder.findByIdOrThrow(userId);
        Training training = trainingFinder.findByIdOrThrow(trainingId);

        TrainingSession entity = TrainingSession.create(user, training);
        trainingSessionRepository.save(entity);

        log.info("Training session created trainingId={} userId={}", trainingId, userId);
        return trainingSessionMapper.toResponse(entity);
    }

    @Override
    @Transactional
    @PreAuthorize("#userId == authentication.principal.userId")
    public TrainingSessionResponse complete(Long sessionId, Long userId) {
        log.info("Completing training session sessionId={} userId={}", sessionId, userId);
        TrainingSession entity = findByIdOrThrow(sessionId, userId);

        ensureSessionInProgress(entity);
        ensureAllExercisesFinished(entity);
        entity.complete();

        log.info("Training session completed sessionId={} userId={}", sessionId, userId);
        return trainingSessionMapper.toResponse(entity);
    }

    @Override
    @Transactional
    @PreAuthorize("#userId == authentication.principal.userId")
    public TrainingSessionResponse abandon(Long sessionId, Long userId) {
        log.info("Abandoning training session sessionId={} userId={}", sessionId, userId);
        TrainingSession entity = findByIdOrThrow(sessionId, userId);

        ensureSessionInProgress(entity);
        entity.abandon();

        log.info("Training session abandoned sessionId={} userId={}", sessionId, userId);
        return trainingSessionMapper.toResponse(entity);
    }

    @Override
    public TrainingSession findByIdOrThrow(Long id, Long userId) {
        log.debug("Fetching training session id={} userId={}", id, userId);
        return trainingSessionRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new NotFoundException("{training.session.id.not.found}", id));
    }

    private void ensureNoActiveSession(Long trainingId, Long userId) {
        boolean hasActiveSession = trainingSessionRepository.existsByUserIdAndTrainingIdAndTrainingStatus(
                userId,
                trainingId,
                TrainingStatus.IN_PROGRESS
        );

        if (hasActiveSession) {
            log.debug("Active sessions already exists trainingId={} userId={}", trainingId, userId);
            throw new BadRequestException("{training.session.already.in.progress}", trainingId);
        }
    }

    private void ensureSessionInProgress(TrainingSession entity) {
        if (entity.getTrainingStatus() != TrainingStatus.IN_PROGRESS) {
            log.debug("Session not in progress sessionId={} status={}", entity.getId(), entity.getTrainingStatus());
            throw new BadRequestException("{training.session.already.finished}", entity.getId());
        }
    }

    private void ensureAllExercisesFinished(TrainingSession entity) {
        boolean hasIncompleteExercises = entity.getExercises().stream()
                .anyMatch(exercise -> !exercise.isFinished());

        if (hasIncompleteExercises) {
            log.debug("Session has unfinished exercises sessionId={}", entity.getId());
            throw new BadRequestException("{training.session.not.ready.for.complete}", entity.getId());
        }
    }
}
