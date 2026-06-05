package io.github.artsobol.progressservice.feature.training.rating.repository;

import io.github.artsobol.progressservice.feature.training.rating.entity.TrainingRating;
import io.github.artsobol.progressservice.feature.training.shared.entity.TrainingUserId;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Slice;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface TrainingRatingRepository extends JpaRepository<TrainingRating, TrainingUserId> {

    Optional<TrainingRating> findByTrainingIdAndUserId(Long trainingId, Long userId);

    Slice<TrainingRating> findByTrainingId(Long trainingId, Pageable pageable);
}
