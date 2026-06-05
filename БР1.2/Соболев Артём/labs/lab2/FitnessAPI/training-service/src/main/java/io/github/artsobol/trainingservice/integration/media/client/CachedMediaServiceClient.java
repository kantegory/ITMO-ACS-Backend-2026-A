package io.github.artsobol.trainingservice.integration.media.client;

import io.github.artsobol.common.exception.http.NotFoundException;
import io.github.artsobol.trainingservice.integration.media.projection.MediaVideoCatalogProjectionService;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Primary;
import org.springframework.stereotype.Component;

@Primary
@Component
@RequiredArgsConstructor
public class CachedMediaServiceClient implements MediaServiceClient {

    private final MediaVideoCatalogProjectionService projectionService;
    private final RestClientMediaServiceClient restClientMediaServiceClient;

    @Override
    public void assertVideoExists(Long videoId) {
        projectionService.findByVideoId(videoId).ifPresentOrElse(
                video -> {
                    if (!video.isActive()) {
                        throw new NotFoundException("video.id.not.found", videoId);
                    }
                },
                () -> restClientMediaServiceClient.assertVideoExists(videoId)
        );
    }
}
