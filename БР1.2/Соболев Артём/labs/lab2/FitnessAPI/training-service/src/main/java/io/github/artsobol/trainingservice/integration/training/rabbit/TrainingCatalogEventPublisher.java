package io.github.artsobol.trainingservice.integration.training.rabbit;

import io.github.artsobol.common.messaging.RabbitTopology;
import io.github.artsobol.common.messaging.training.TrainingCatalogEvent;
import io.github.artsobol.common.messaging.training.TrainingCatalogExerciseEvent;
import io.github.artsobol.trainingservice.feature.training.exercise.entity.TrainingExercise;
import io.github.artsobol.trainingservice.feature.training.training.entity.Training;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.stereotype.Component;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;
import tools.jackson.databind.ObjectMapper;

import java.util.Comparator;
import java.util.List;

@Slf4j
@Component
@RequiredArgsConstructor
public class TrainingCatalogEventPublisher {

    private final RabbitTemplate rabbitTemplate;
    private final ObjectMapper objectMapper;

    public void publishChanged(Training training) {
        TrainingCatalogEvent event = toEvent(training);
        Runnable publish = () -> send(event);

        if (TransactionSynchronizationManager.isSynchronizationActive()) {
            TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
                @Override
                public void afterCommit() {
                    publish.run();
                }
            });
            return;
        }

        publish.run();
    }

    private void send(TrainingCatalogEvent event) {
        try {
            String payload = objectMapper.writeValueAsString(event);
            rabbitTemplate.convertAndSend(
                    RabbitTopology.TRAINING_EVENTS_EXCHANGE,
                    RabbitTopology.TRAINING_CHANGED_ROUTING_KEY,
                    payload
            );
            log.info("Training catalog event published trainingId={} active={}", event.trainingId(), event.active());
        } catch (Exception ex) {
            log.error("Failed to publish training catalog event trainingId={}", event.trainingId(), ex);
        }
    }

    private TrainingCatalogEvent toEvent(Training training) {
        List<TrainingCatalogExerciseEvent> exercises = training.getExercises()
                .stream()
                .sorted(Comparator.comparingInt(TrainingExercise::getOrderIndex))
                .map(exercise -> new TrainingCatalogExerciseEvent(
                        exercise.getId(),
                        exercise.getExerciseId(),
                        exercise.getOrderIndex()
                ))
                .toList();

        return new TrainingCatalogEvent(training.getId(), training.isActive(), exercises);
    }
}
