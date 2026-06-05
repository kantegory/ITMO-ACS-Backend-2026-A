package io.github.artsobol.blogservice.feature.article.article.dto.response;

import java.util.Set;

public record ArticleResponse(
        Long id,
        String title,
        String description,
        Set<Long> videoIds,
        Set<CategoryResponse> categories,
        Long authorId
) {
}
