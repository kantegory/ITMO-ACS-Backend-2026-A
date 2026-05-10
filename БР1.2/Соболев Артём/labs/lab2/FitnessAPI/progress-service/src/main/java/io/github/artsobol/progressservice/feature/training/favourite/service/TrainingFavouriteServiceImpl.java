package io.github.artsobol.progressservice.feature.training.favourite.service;

import io.github.artsobol.common.exception.http.NotFoundException;
import io.github.artsobol.progressservice.feature.training.favourite.dto.response.TrainingFavouriteResponse;
import io.github.artsobol.progressservice.feature.training.favourite.entity.TrainingFavourite;
import io.github.artsobol.progressservice.feature.training.favourite.mapper.TrainingFavouriteMapper;
import io.github.artsobol.progressservice.feature.training.favourite.repository.TrainingFavouriteRepository;
import io.github.artsobol.progressservice.integration.training.client.TrainingServiceClient;
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
public class TrainingFavouriteServiceImpl implements TrainingFavouriteService {

    private final TrainingFavouriteRepository trainingFavouriteRepository;
    private final TrainingFavouriteMapper trainingFavouriteMapper;
    private final TrainingServiceClient trainingServiceClient;

    @Override
    @Transactional
    @PreAuthorize("#userId == authentication.principal.userId")
    public TrainingFavouriteResponse create(Long userId, Long trainingId) {
        log.info("Creating favourite training trainingId={} userId={}", trainingId, userId);
        trainingServiceClient.assertTrainingExists(trainingId);
        TrainingFavourite entity = TrainingFavourite.create(trainingId, userId);
        trainingFavouriteRepository.save(entity);

        log.info("Favourite training created trainingId={} userId={}", trainingId, userId);
        return trainingFavouriteMapper.toResponse(entity);
    }

    @Override
    @Transactional(readOnly = true)
    @PreAuthorize("#userId == authentication.principal.userId")
    public Slice<TrainingFavouriteResponse> getAll(Long userId, Pageable pageable) {
        log.debug(
                "Fetching favourite trainings userId={} page={} size={} sort={}",
                userId,
                pageable.getPageNumber(),
                pageable.getPageSize(),
                pageable.getSort()
        );
        return trainingFavouriteRepository.findByUserId(userId, pageable).map(trainingFavouriteMapper::toResponse);
    }

    @Override
    @Transactional
    @PreAuthorize("#userId == authentication.principal.userId")
    public void delete(Long userId, Long trainingId) {
        log.info("Deleting favourite training trainingId={} userId={}",  trainingId, userId);
        TrainingFavourite entity = trainingFavouriteRepository.findByUserIdAndTrainingId(userId, trainingId).orElseThrow(
                () -> new NotFoundException("training.favourite.not.found", userId, trainingId)
        );
        trainingFavouriteRepository.delete(entity);
        log.info("Favourite training deleted trainingId={} userId={}", trainingId, userId);
    }
}
