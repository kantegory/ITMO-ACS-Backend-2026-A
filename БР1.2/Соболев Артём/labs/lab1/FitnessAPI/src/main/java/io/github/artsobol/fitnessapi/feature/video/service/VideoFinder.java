package io.github.artsobol.fitnessapi.feature.video.service;

import io.github.artsobol.fitnessapi.feature.video.entity.Video;

public interface VideoFinder {

    Video findByIdOrThrow(Long id);
}
