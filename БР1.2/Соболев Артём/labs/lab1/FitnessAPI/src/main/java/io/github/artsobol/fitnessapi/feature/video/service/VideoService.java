package io.github.artsobol.fitnessapi.feature.video.service;

import io.github.artsobol.fitnessapi.feature.video.dto.request.CreateVideoRequest;
import io.github.artsobol.fitnessapi.feature.video.dto.request.UpdateVideoRequest;
import io.github.artsobol.fitnessapi.feature.video.dto.response.VideoResponse;

public interface VideoService {

    VideoResponse getById(Long id);

    VideoResponse create(CreateVideoRequest request);

    VideoResponse update(Long id, UpdateVideoRequest request);

    void delete(Long id);
}
