package io.github.artsobol.trainingservice.integration.media.rabbit;

import io.github.artsobol.common.messaging.RabbitTopology;
import io.github.artsobol.common.messaging.media.VideoCatalogEvent;
import io.github.artsobol.trainingservice.integration.media.projection.MediaVideoCatalogProjectionService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;
import tools.jackson.databind.ObjectMapper;

@Slf4j
@Component
@RequiredArgsConstructor
public class MediaVideoCatalogEventListener {

    private final ObjectMapper objectMapper;
    private final MediaVideoCatalogProjectionService projectionService;

    @RabbitListener(queues = RabbitTopology.TRAINING_VIDEO_EVENTS_QUEUE)
    public void onVideoCatalogChanged(String payload) {
        try {
            VideoCatalogEvent event = objectMapper.readValue(payload, VideoCatalogEvent.class);
            projectionService.apply(event);
        } catch (Exception ex) {
            log.error("Failed to handle media video catalog event payload={}", payload, ex);
            throw new IllegalStateException("Failed to handle media video catalog event", ex);
        }
    }
}
