package io.github.artsobol.fitnessapi.feature.article.article.dto.response;

import io.github.artsobol.fitnessapi.feature.user.dto.response.UserResponse;
import io.github.artsobol.fitnessapi.feature.video.dto.response.VideoResponse;

import java.util.Set;

public record ArticleResponse(
        Long id,
        String title,
        String description,
        Set<VideoResponse> videos,
        Set<CategoryResponse> categories,
        UserResponse author
) {
}
