package io.github.artsobol.blogservice.integration.media.projection;

import io.github.artsobol.common.messaging.media.VideoCatalogEvent;
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

    @Transactional
    public void apply(VideoCatalogEvent event) {
        MediaVideoCatalog catalog = repository
                .findById(event.videoId())
                .orElseGet(() -> MediaVideoCatalog.create(event.videoId()));

        catalog.applySnapshot(event.title(), event.url(), event.active());
        repository.save(catalog);
        log.info("Media video catalog projection updated videoId={} active={}", event.videoId(), event.active());
    }

    @Transactional(readOnly = true)
    public Optional<MediaVideoCatalog> findByVideoId(Long videoId) {
        return repository.findById(videoId);
    }
}
