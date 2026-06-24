package io.github.artsobol.fitnessapi.feature.training.rating.repository;

import io.github.artsobol.fitnessapi.feature.training.rating.entity.TrainingRating;
import io.github.artsobol.fitnessapi.feature.training.training.entity.TrainingUserId;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Slice;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface TrainingRatingRepository extends JpaRepository<TrainingRating, TrainingUserId> {

    Optional<TrainingRating> findByTrainingIdAndUserId(Long trainingId, Long userId);

    Slice<TrainingRating> findByTrainingId(Long trainingId, Pageable pageable);
}
