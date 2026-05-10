package io.github.artsobol.progressservice.feature.progress.service;

import io.github.artsobol.progressservice.feature.progress.dto.response.UserProgressResponse;

public interface ProgressService {

    UserProgressResponse getProgress(Long userId);
}
