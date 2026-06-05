package io.github.artsobol.trainingservice.feature.exercise.service;

import io.github.artsobol.common.exception.http.NotFoundException;
import io.github.artsobol.trainingservice.feature.exercise.dto.request.CreateExerciseRequest;
import io.github.artsobol.trainingservice.feature.exercise.dto.request.UpdateExerciseRequest;
import io.github.artsobol.trainingservice.feature.exercise.dto.response.ExerciseResponse;
import io.github.artsobol.trainingservice.feature.exercise.entity.Exercise;
import io.github.artsobol.trainingservice.feature.exercise.mapper.ExerciseMapper;
import io.github.artsobol.trainingservice.feature.exercise.repository.ExerciseRepository;
import io.github.artsobol.trainingservice.integration.media.client.MediaServiceClient;
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
public class ExerciseServiceImpl implements ExerciseService, ExerciseFinder {

    private final ExerciseRepository repository;
    private final ExerciseMapper mapper;
    private final MediaServiceClient mediaServiceClient;

    @Override
    @Transactional(readOnly = true)
    public ExerciseResponse getById(Long id) {
        Exercise entity = findByIdOrThrow(id);

        return mapper.toResponse(entity);
    }

    @Override
    @Transactional(readOnly = true)
    public Slice<ExerciseResponse> getAll(Pageable pageable, String name) {
        log.debug(
                "Fetching exercise page={} size={} sort={} name={}",
                pageable.getPageNumber(),
                pageable.getPageSize(),
                pageable.getSort(),
                name
        );
        if (hasSearchName(name)) {
            return repository.findByIsActiveTrueAndTitleContainingIgnoreCase(name.strip(), pageable)
                    .map(mapper::toResponse);
        }
        return repository.findByIsActiveTrue(pageable).map(mapper::toResponse);
    }

    @Override
    @Transactional
    @PreAuthorize("hasAnyAuthority('TRAINER', 'ADMIN') and #authorId == authentication.principal.userId")
    public ExerciseResponse create(CreateExerciseRequest request, Long authorId) {
        log.info("Creating exercise exerciseTitle={} authorId={}", request.title(), authorId);
        Exercise entity = Exercise.create(
                authorId,
                request.title(),
                request.description(),
                request.muscleGroup(),
                request.trainingLevel()
        );
        repository.save(entity);

        log.info("Exercise created exerciseId={} authorId={}", entity.getId(), entity.getAuthorId());
        return mapper.toResponse(entity);
    }

    @Override
    @Transactional
    @PreAuthorize("hasAnyAuthority('ADMIN') or @exerciseAccess.canEdit(#exerciseId, authentication)")
    public ExerciseResponse update(Long exerciseId, UpdateExerciseRequest request) {
        log.info("Updating exercise exerciseId={}", exerciseId);
        Exercise entity = findByIdOrThrow(exerciseId);
        entity.applyPatch(request.title(), request.description(), request.muscleGroup(), request.trainingLevel());

        log.info("Exercise updated exerciseId={}", entity.getId());
        return mapper.toResponse(entity);
    }

    @Override
    @Transactional
    @PreAuthorize("hasAnyAuthority('ADMIN') or @exerciseAccess.canEdit(#exerciseId, authentication)")
    public ExerciseResponse addVideo(Long exerciseId, Long videoId) {
        log.info("Adding video exerciseId={} videoId={}", exerciseId, videoId);
        Exercise entity = findByIdOrThrow(exerciseId);
        mediaServiceClient.assertVideoExists(videoId);
        entity.addVideo(videoId);

        log.info("Video added exerciseId={} videoId={}", entity.getId(), videoId);
        return mapper.toResponse(entity);
    }

    @Override
    @Transactional
    @PreAuthorize("hasAnyAuthority('ADMIN') or @exerciseAccess.canEdit(#exerciseId, authentication)")
    public void removeVideo(Long exerciseId, Long videoId) {
        log.info("Removing video exerciseId={} videoId={}", exerciseId, videoId);
        Exercise entity = findByIdOrThrow(exerciseId);
        entity.removeVideo(videoId);
    }

    @Override
    @Transactional
    @PreAuthorize("hasAnyAuthority('ADMIN') or @exerciseAccess.canEdit(#exerciseId, authentication)")
    public void deactivate(Long exerciseId) {
        log.info("Deactivating exercise exerciseId={}", exerciseId);
        Exercise entity = findByIdOrThrow(exerciseId);
        entity.deactivate();
        log.info("Exercise deactivated exerciseId={}", entity.getId());
    }

    @Override
    public Exercise findByIdOrThrow(Long id) {
        log.debug("Fetching exercise exerciseId={}", id);
        return repository.findByIdAndIsActiveTrue(id)
                .orElseThrow(() -> new NotFoundException("exercise.id.not.found", id));
    }

    private boolean hasSearchName(String name) {
        return name != null && !name.isBlank();
    }
}
