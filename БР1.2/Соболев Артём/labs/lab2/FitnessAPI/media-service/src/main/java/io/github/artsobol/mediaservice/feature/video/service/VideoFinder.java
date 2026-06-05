package io.github.artsobol.mediaservice.feature.video.service;

import io.github.artsobol.mediaservice.feature.video.entity.Video;

public interface VideoFinder {

    Video findByIdOrThrow(Long id);
}
