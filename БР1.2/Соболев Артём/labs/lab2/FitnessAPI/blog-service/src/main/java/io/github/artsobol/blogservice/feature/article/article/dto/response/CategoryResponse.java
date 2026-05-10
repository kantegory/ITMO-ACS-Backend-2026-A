package io.github.artsobol.blogservice.feature.article.article.dto.response;

public record CategoryResponse(
        Long id,
        String name,
        String slug
) {
}
