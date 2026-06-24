package io.github.artsobol.fitnessapi.feature.exercise.service;

import io.github.artsobol.fitnessapi.exception.http.NotFoundException;
import io.github.artsobol.fitnessapi.feature.exercise.dto.request.CreateExerciseRequest;
import io.github.artsobol.fitnessapi.feature.exercise.dto.request.UpdateExerciseRequest;
import io.github.artsobol.fitnessapi.feature.exercise.dto.response.ExerciseResponse;
import io.github.artsobol.fitnessapi.feature.exercise.entity.Exercise;
import io.github.artsobol.fitnessapi.feature.exercise.mapper.ExerciseMapper;
import io.github.artsobol.fitnessapi.feature.exercise.repository.ExerciseRepository;
import io.github.artsobol.fitnessapi.feature.user.entity.User;
import io.github.artsobol.fitnessapi.feature.user.service.UserFinder;
import io.github.artsobol.fitnessapi.feature.video.entity.Video;
import io.github.artsobol.fitnessapi.feature.video.service.VideoFinder;
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
    private final VideoFinder videoFinder;
    private final UserFinder userFinder;

    @Override
    @Transactional(readOnly = true)
    public ExerciseResponse getById(Long id) {
        Exercise entity = findByIdOrThrow(id);

        return mapper.toResponse(entity);
    }

    @Override
    @Transactional(readOnly = true)
    public Slice<ExerciseResponse> getAll(Pageable pageable) {
        log.debug(
                "Fetching exercise page={} size={} sort={}",
                pageable.getPageNumber(),
                pageable.getPageSize(),
                pageable.getSort()
        );
        return repository.findByIsActiveTrue(pageable).map(mapper::toResponse);
    }

    @Override
    @Transactional
    @PreAuthorize("hasAnyAuthority('TRAINER', 'ADMIN') and #authorId == authentication.principal.userId")
    public ExerciseResponse create(CreateExerciseRequest request, Long authorId) {
        log.info("Creating exercise exerciseTitle={} authorId={}", request.title(), authorId);
        User author = userFinder.findByIdOrThrow(authorId);
        Exercise entity = Exercise.create(
                author,
                request.title(),
                request.description(),
                request.muscleGroup(),
                request.trainingLevel()
        );
        repository.save(entity);

        log.info("Exercise created exerciseId={} authorId={}", entity.getId(), entity.getAuthor().getId());
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
        Video video = videoFinder.findByIdOrThrow(videoId);
        entity.addVideo(video);

        log.info("Video added exerciseId={} videoId={}", entity.getId(), video.getId());
        return mapper.toResponse(entity);
    }

    @Override
    @Transactional
    @PreAuthorize("hasAnyAuthority('ADMIN') or @exerciseAccess.canEdit(#exerciseId, authentication)")
    public void removeVideo(Long exerciseId, Long videoId) {
        log.info("Removing video exerciseId={} videoId={}", exerciseId, videoId);
        Exercise entity = findByIdOrThrow(exerciseId);
        Video video = videoFinder.findByIdOrThrow(videoId);
        entity.removeVideo(video);
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
                .orElseThrow(() -> new NotFoundException("{exercise.id.not.found}", id));
    }
}
