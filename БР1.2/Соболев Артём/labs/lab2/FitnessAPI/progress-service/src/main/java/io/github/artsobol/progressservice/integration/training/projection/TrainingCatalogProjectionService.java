package io.github.artsobol.progressservice.integration.training.projection;

import io.github.artsobol.common.messaging.training.TrainingCatalogEvent;
import io.github.artsobol.progressservice.integration.training.client.RemoteTrainingExerciseResponse;
import io.github.artsobol.progressservice.integration.training.client.RemoteTrainingResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
public class TrainingCatalogProjectionService {

    private final TrainingCatalogRepository trainingCatalogRepository;

    @Transactional
    public void apply(TrainingCatalogEvent event) {
        TrainingCatalog catalog = trainingCatalogRepository
                .findById(event.trainingId())
                .orElseGet(() -> TrainingCatalog.create(event.trainingId()));

        List<TrainingCatalogExerciseSnapshot> exercises = event.exercises()
                .stream()
                .map(exercise -> new TrainingCatalogExerciseSnapshot(
                        exercise.trainingExerciseId(),
                        exercise.exerciseId(),
                        exercise.orderIndex()
                ))
                .toList();

        catalog.replaceSnapshot(event.active(), exercises);
        trainingCatalogRepository.save(catalog);
        log.info("Training catalog projection updated trainingId={} active={}", event.trainingId(), event.active());
    }

    @Transactional(readOnly = true)
    public Optional<RemoteTrainingResponse> findActiveTraining(Long trainingId) {
        return trainingCatalogRepository.findByIdAndActiveTrue(trainingId)
                .map(catalog -> new RemoteTrainingResponse(
                        catalog.getId(),
                        catalog.getExercises()
                                .stream()
                                .map(exercise -> new RemoteTrainingExerciseResponse(
                                        exercise.getTrainingExerciseId(),
                                        exercise.getExerciseId(),
                                        exercise.getOrderIndex()
                                ))
                                .toList()
                ));
    }
}
