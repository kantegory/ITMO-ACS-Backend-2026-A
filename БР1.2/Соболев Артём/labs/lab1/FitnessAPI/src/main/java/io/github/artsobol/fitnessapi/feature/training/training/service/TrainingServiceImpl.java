package io.github.artsobol.fitnessapi.feature.training.training.service;

import io.github.artsobol.fitnessapi.exception.http.NotFoundException;
import io.github.artsobol.fitnessapi.feature.exercise.entity.Exercise;
import io.github.artsobol.fitnessapi.feature.exercise.service.ExerciseFinder;
import io.github.artsobol.fitnessapi.feature.training.exercise.entity.TrainingExercise;
import io.github.artsobol.fitnessapi.feature.training.exercise.repository.TrainingExerciseRepository;
import io.github.artsobol.fitnessapi.feature.training.exercise.service.TrainingExerciseFinder;
import io.github.artsobol.fitnessapi.feature.training.tag.entity.Tag;
import io.github.artsobol.fitnessapi.feature.training.tag.service.TagFinder;
import io.github.artsobol.fitnessapi.feature.training.training.dto.request.CreateTrainingRequest;
import io.github.artsobol.fitnessapi.feature.training.training.dto.request.UpdateTrainingRequest;
import io.github.artsobol.fitnessapi.feature.training.training.dto.response.TrainingResponse;
import io.github.artsobol.fitnessapi.feature.training.training.entity.Training;
import io.github.artsobol.fitnessapi.feature.training.training.mapper.TrainingMapper;
import io.github.artsobol.fitnessapi.feature.training.training.repository.TrainingRepository;
import io.github.artsobol.fitnessapi.feature.training.type.entity.Type;
import io.github.artsobol.fitnessapi.feature.training.type.service.TypeFinder;
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
public class TrainingServiceImpl implements TrainingService, TrainingFinder {

    private final TrainingRepository trainingRepository;
    private final TrainingExerciseRepository trainingExerciseRepository;
    private final TrainingMapper trainingMapper;
    private final ExerciseFinder exerciseFinder;
    private final TagFinder tagFinder;
    private final TypeFinder typeFinder;
    private final TrainingExerciseFinder trainingExerciseFinder;
    private final UserFinder userFinder;

    @Override
    @Transactional(readOnly = true)
    public TrainingResponse getById(Long trainingId) {
        Training entity = findByIdOrThrow(trainingId);

        return trainingMapper.toResponse(entity);
    }

    @Override
    @Transactional(readOnly = true)
    public Slice<TrainingResponse> getAll(Pageable pageable) {
        log.debug(
                "Fetching trainings page={} size={} sort={}",
                pageable.getPageNumber(),
                pageable.getPageSize(),
                pageable.getSort()
        );
        return trainingRepository.findByIsActiveTrue(pageable).map(trainingMapper::toResponse);
    }

    @Override
    @Transactional
    @PreAuthorize("hasAnyAuthority('TRAINER', 'ADMIN') and #authorId == authentication.principal.userId")
    public TrainingResponse create(CreateTrainingRequest request, Long authorId) {
        log.info("Creating training title={} authorId={}", request.title(), authorId);
        User author = userFinder.findByIdOrThrow(authorId);
        Training entity = Training.create(author, request.title(), request.description(), request.trainingLevel());
        trainingRepository.save(entity);

        log.info("Training created trainingId={} authorId={}", entity.getId(), entity.getAuthor().getId());
        return trainingMapper.toResponse(entity);
    }

    @Override
    @Transactional
    @PreAuthorize("hasAuthority('ADMIN') or @trainingAccess.canEdit(#trainingId, authentication)")
    public TrainingResponse update(UpdateTrainingRequest request, Long trainingId) {
        log.info("Updating training trainingId={}", trainingId);
        Training entity = findByIdOrThrow(trainingId);
        entity.applyPatch(request.title(), request.description(), request.trainingLevel());

        log.info("Training updated trainingId={}", entity.getId());
        return trainingMapper.toResponse(entity);
    }

    @Override
    @Transactional
    @PreAuthorize("hasAuthority('ADMIN') or @trainingAccess.canEdit(#trainingId, authentication)")
    public TrainingResponse addExercise(Long trainingId, Long exerciseId) {
        log.info("Adding exercise trainingId={} exerciseId={}", trainingId, exerciseId);
        Training entity = findByIdOrThrow(trainingId);
        Exercise exercise = exerciseFinder.findByIdOrThrow(exerciseId);
        entity.addExercise(exercise);

        log.info("Exercise added trainingId={} exerciseId={}", entity.getId(), exercise.getId());
        return trainingMapper.toResponse(entity);
    }

    @Override
    @Transactional
    @PreAuthorize("hasAuthority('ADMIN') or @trainingAccess.canEdit(#trainingId, authentication)")
    public void removeExercise(Long trainingId, Long trainingExerciseId) {
        log.info("Removing exercise trainingId={} trainingExerciseId={}", trainingId, trainingExerciseId);
        ensureHasExercise(trainingExerciseId, trainingId);
        Training entity = findByIdOrThrow(trainingId);
        TrainingExercise exercise = trainingExerciseFinder.findByIdOrThrow(trainingExerciseId);
        entity.removeExercise(exercise);

        log.info("Exercise removed trainingId={} trainingExerciseId={}", entity.getId(), trainingExerciseId);
    }

    @Override
    @Transactional
    @PreAuthorize("hasAuthority('ADMIN') or @trainingAccess.canEdit(#trainingId, authentication)")
    public TrainingResponse addTag(Long trainingId, String tagSlug) {
        log.info("Adding tag trainingId={}, tagSlug={}", trainingId, tagSlug);
        Training entity = findByIdOrThrow(trainingId);
        Tag tag = tagFinder.findBySlugOrThrow(tagSlug);
        entity.addTag(tag);

        log.info("Tag added trainingId={} tagId={} tagSlug={}", entity.getId(), tag.getId(), tag.getSlug());
        return trainingMapper.toResponse(entity);
    }

    @Override
    @Transactional
    @PreAuthorize("hasAuthority('ADMIN') or @trainingAccess.canEdit(#trainingId, authentication)")
    public void removeTag(Long trainingId, String tagSlug) {
        log.info("Removing tag trainingId={} tagSlug={}", trainingId, tagSlug);
        Training entity = findByIdOrThrow(trainingId);
        Tag tag = tagFinder.findBySlugOrThrow(tagSlug);

        entity.removeTag(tag);
        log.info("Tag removed trainingId={} tagId={} tagSlug={}", entity.getId(), tag.getId(), tag.getSlug());
    }

    @Override
    @Transactional
    @PreAuthorize("hasAuthority('ADMIN') or @trainingAccess.canEdit(#trainingId, authentication)")
    public TrainingResponse addType(Long trainingId, String typeSlug) {
        log.info("Adding type trainingId={} typeSlug={}", trainingId, typeSlug);
        Training entity = findByIdOrThrow(trainingId);
        Type type = typeFinder.findBySlugOrThrow(typeSlug);
        entity.addType(type);

        log.info("Type added trainingId={} typeId={} typeSlug={}", entity.getId(), type.getId(), type.getSlug());
        return trainingMapper.toResponse(entity);
    }

    @Override
    @Transactional
    @PreAuthorize("hasAuthority('ADMIN') or @trainingAccess.canEdit(#trainingId, authentication)")
    public void removeType(Long trainingId, String typeSlug) {
        log.info("Removing type trainingId={} typeSlug={}", trainingId, typeSlug);
        Training entity = findByIdOrThrow(trainingId);
        Type type = typeFinder.findBySlugOrThrow(typeSlug);
        entity.removeType(type);
        log.info("Type removed trainingId={} typeId={} typeSlug={}", entity.getId(), type.getId(), type.getSlug());
    }

    @Override
    @Transactional
    @PreAuthorize("hasAuthority('ADMIN') or @trainingAccess.canEdit(#trainingId, authentication)")
    public void deactivate(Long trainingId) {
        log.info("Deactivating training trainingId={}", trainingId);
        Training entity = findByIdOrThrow(trainingId);
        entity.deactivate();
        log.info("Training deactivated trainingId={}", trainingId);
    }

    @Override
    public Training findByIdOrThrow(Long trainingId) {
        log.debug("Fetching training trainingId={}", trainingId);
        return trainingRepository.findByIdAndIsActiveTrue(trainingId)
                .orElseThrow(() -> new NotFoundException("{training.id.not.found}", trainingId));
    }

    private void ensureHasExercise(Long trainingExerciseId, Long trainingId) {
        if (!trainingExerciseRepository.existsByIdAndTrainingId(trainingExerciseId, trainingId)) {
            throw new NotFoundException("{training.exercise.not.found}", trainingExerciseId, trainingId);
        }
    }
}
