package io.github.artsobol.progressservice.feature.training.session.repository;

import io.github.artsobol.progressservice.feature.training.session.entity.TrainingSession;
import io.github.artsobol.progressservice.feature.training.session.entity.TrainingStatus;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Slice;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface TrainingSessionRepository extends JpaRepository<TrainingSession, Long> {

    Slice<TrainingSession> findByUserId(Long userId, Pageable pageable);

    Optional<TrainingSession> findByIdAndUserId(Long id, Long userId);

    long countByUserId(Long userId);

    long countByUserIdAndTrainingStatus(Long userId, TrainingStatus trainingStatus);

    boolean existsByUserIdAndTrainingIdAndTrainingStatus(Long userId, Long trainingId, TrainingStatus trainingStatus);
}
