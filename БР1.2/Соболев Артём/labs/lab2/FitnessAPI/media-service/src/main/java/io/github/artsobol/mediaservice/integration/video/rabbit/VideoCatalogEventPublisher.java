package io.github.artsobol.mediaservice.integration.video.rabbit;

import io.github.artsobol.common.messaging.RabbitTopology;
import io.github.artsobol.common.messaging.media.VideoCatalogEvent;
import io.github.artsobol.mediaservice.feature.video.entity.Video;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.stereotype.Component;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;
import tools.jackson.databind.ObjectMapper;

@Slf4j
@Component
@RequiredArgsConstructor
public class VideoCatalogEventPublisher {

    private final RabbitTemplate rabbitTemplate;
    private final ObjectMapper objectMapper;

    public void publishChanged(Video video) {
        publish(new VideoCatalogEvent(video.getId(), video.getTitle(), video.getUrl(), true));
    }

    public void publishDeleted(Video video) {
        publish(new VideoCatalogEvent(video.getId(), video.getTitle(), video.getUrl(), false));
    }

    private void publish(VideoCatalogEvent event) {
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

    private void send(VideoCatalogEvent event) {
        try {
            String payload = objectMapper.writeValueAsString(event);
            rabbitTemplate.convertAndSend(
                    RabbitTopology.MEDIA_EVENTS_EXCHANGE,
                    RabbitTopology.VIDEO_CHANGED_ROUTING_KEY,
                    payload
            );
            log.info("Video catalog event published videoId={} active={}", event.videoId(), event.active());
        } catch (Exception ex) {
            log.error("Failed to publish video catalog event videoId={}", event.videoId(), ex);
        }
    }
}
