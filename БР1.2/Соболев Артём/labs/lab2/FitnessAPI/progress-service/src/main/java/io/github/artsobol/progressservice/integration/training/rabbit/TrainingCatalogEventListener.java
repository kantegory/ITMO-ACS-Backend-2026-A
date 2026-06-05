package io.github.artsobol.progressservice.integration.training.rabbit;

import io.github.artsobol.common.messaging.RabbitTopology;
import io.github.artsobol.common.messaging.training.TrainingCatalogEvent;
import io.github.artsobol.progressservice.integration.training.projection.TrainingCatalogProjectionService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;
import tools.jackson.databind.ObjectMapper;

@Slf4j
@Component
@RequiredArgsConstructor
public class TrainingCatalogEventListener {

    private final ObjectMapper objectMapper;
    private final TrainingCatalogProjectionService projectionService;

    @RabbitListener(queues = RabbitTopology.PROGRESS_TRAINING_EVENTS_QUEUE)
    public void onTrainingCatalogChanged(String payload) {
        try {
            TrainingCatalogEvent event = objectMapper.readValue(payload, TrainingCatalogEvent.class);
            projectionService.apply(event);
        } catch (Exception ex) {
            log.error("Failed to handle training catalog event payload={}", payload, ex);
            throw new IllegalStateException("Failed to handle training catalog event", ex);
        }
    }
}
