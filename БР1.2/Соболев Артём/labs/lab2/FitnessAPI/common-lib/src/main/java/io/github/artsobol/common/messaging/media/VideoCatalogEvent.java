package io.github.artsobol.common.messaging.media;

public record VideoCatalogEvent(
        Long videoId,
        String title,
        String url,
        boolean active
) {
}
