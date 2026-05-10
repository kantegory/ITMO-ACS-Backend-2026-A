package io.github.artsobol.trainingservice.integration.media.projection;

import io.github.artsobol.common.messaging.media.VideoCatalogEvent;
import io.github.artsobol.trainingservice.feature.exercise.repository.ExerciseRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
public class MediaVideoCatalogProjectionService {

    private final MediaVideoCatalogRepository repository;
    private final ExerciseRepository exerciseRepository;

    @Transactional
    public void apply(VideoCatalogEvent event) {
        MediaVideoCatalog catalog = repository
                .findById(event.videoId())
                .orElseGet(() -> MediaVideoCatalog.create(event.videoId()));

        catalog.applySnapshot(event.title(), event.url(), event.active());
        repository.save(catalog);

        if (!event.active()) {
            int removedReferences = exerciseRepository.deleteVideoReferences(event.videoId());
            log.info(
                    "Inactive media video references removed from exercises videoId={} references={}",
                    event.videoId(),
                    removedReferences
            );
        }

        log.info("Media video catalog projection updated videoId={} active={}", event.videoId(), event.active());
    }

    @Transactional(readOnly = true)
    public Optional<MediaVideoCatalog> findByVideoId(Long videoId) {
        return repository.findById(videoId);
    }
}
