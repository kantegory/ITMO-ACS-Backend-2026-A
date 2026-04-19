package io.github.artsobol.fitnessapi.feature.training.rating.service;

import io.github.artsobol.fitnessapi.exception.http.NotFoundException;
import io.github.artsobol.fitnessapi.feature.training.rating.dto.request.CreateTrainingRatingRequest;
import io.github.artsobol.fitnessapi.feature.training.rating.dto.request.UpdateTrainingRatingRequest;
import io.github.artsobol.fitnessapi.feature.training.rating.dto.response.TrainingRatingResponse;
import io.github.artsobol.fitnessapi.feature.training.rating.entity.TrainingRating;
import io.github.artsobol.fitnessapi.feature.training.rating.mapper.TrainingRatingMapper;
import io.github.artsobol.fitnessapi.feature.training.rating.repository.TrainingRatingRepository;
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
public class TrainingRatingServiceImpl implements TrainingRatingService {

    private final TrainingRatingRepository trainingRatingRepository;
    private final TrainingRatingMapper trainingRatingMapper;
    private final TrainingFinder trainingFinder;
    private final UserFinder userFinder;

    @Override
    @Transactional(readOnly = true)
    public Slice<TrainingRatingResponse> getAll(Long trainingId, Pageable pageable) {
        log.debug(
                "Fetching ratings trainingId={} page={} size={} sort={}",
                trainingId,
                pageable.getPageNumber(),
                pageable.getPageSize(),
                pageable.getSort()
        );
        return trainingRatingRepository.findByTrainingId(trainingId, pageable).map(trainingRatingMapper::toResponse);
    }

    @Override
    @Transactional
    @PreAuthorize("#userId == authentication.principal.userId")
    public TrainingRatingResponse create(Long trainingId, Long userId, CreateTrainingRatingRequest request) {
        log.info("Creating rating trainingId={} userId={}", trainingId, userId);
        User user = userFinder.findByIdOrThrow(userId);
        Training training = trainingFinder.findByIdOrThrow(trainingId);
        TrainingRating entity = TrainingRating.create(training, user, request.rating(), request.comment());
        trainingRatingRepository.save(entity);

        log.info("Rating created trainingId={} userId={}", training, userId);
        return trainingRatingMapper.toResponse(entity);
    }

    @Override
    @Transactional
    @PreAuthorize("#userId == authentication.principal.userId")
    public TrainingRatingResponse update(Long trainingId, Long userId, UpdateTrainingRatingRequest request) {
        log.info("Update rating trainingId={} userId={}", trainingId, userId);
        TrainingRating entity = findByTrainingIdAndUserId(trainingId, userId);
        entity.applyPatch(request.rating(), request.comment());

        log.info("Rating updated trainingId={} userId={}", trainingId, userId);
        return trainingRatingMapper.toResponse(entity);
    }

    @Override
    @Transactional
    @PreAuthorize("#userId == authentication.principal.userId")
    public void delete(Long trainingId, Long userId) {
        log.info("Deleting rating trainingId={} userId={}", trainingId, userId);
        TrainingRating entity = findByTrainingIdAndUserId(trainingId, userId);

        trainingRatingRepository.delete(entity);
        log.info("Rating deleted trainingId={} userId={}", trainingId, userId);
    }

    private TrainingRating findByTrainingIdAndUserId(Long trainingId, Long userId) {
        log.debug("Fetching rating trainingId={} userId={}", trainingId, userId);
        return trainingRatingRepository.findByTrainingIdAndUserId(trainingId, userId).orElseThrow(
                () ->  new NotFoundException("{training.rating.not.found}", trainingId, userId)
        );
    }
}
