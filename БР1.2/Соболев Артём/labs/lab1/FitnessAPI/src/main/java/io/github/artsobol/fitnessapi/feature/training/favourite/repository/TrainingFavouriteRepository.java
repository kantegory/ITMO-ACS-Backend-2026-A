package io.github.artsobol.fitnessapi.feature.training.favourite.repository;

import io.github.artsobol.fitnessapi.feature.training.favourite.entity.TrainingFavourite;
import io.github.artsobol.fitnessapi.feature.training.training.entity.TrainingUserId;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Slice;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface TrainingFavouriteRepository extends JpaRepository<TrainingFavourite, TrainingUserId> {

    Optional<TrainingFavourite> findByUserIdAndTrainingId(Long userId, Long trainingId);

    Slice<TrainingFavourite> findByUserId(Long userId, Pageable pageable);
}
