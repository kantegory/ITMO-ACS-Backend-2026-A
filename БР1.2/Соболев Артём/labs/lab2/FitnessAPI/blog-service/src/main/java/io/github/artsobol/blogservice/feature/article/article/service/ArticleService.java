package io.github.artsobol.blogservice.feature.article.article.service;

import io.github.artsobol.blogservice.feature.article.article.dto.request.CreateArticleRequest;
import io.github.artsobol.blogservice.feature.article.article.dto.request.UpdateArticleRequest;
import io.github.artsobol.blogservice.feature.article.article.dto.response.ArticleResponse;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Slice;

public interface ArticleService {

    ArticleResponse getById(Long id);

    Slice<ArticleResponse> getAll(Pageable pageable, String name);

    ArticleResponse create(CreateArticleRequest request, Long userId);

    ArticleResponse update(UpdateArticleRequest request, Long articleId);

    ArticleResponse addVideo(Long articleId, Long videoId);

    ArticleResponse addCategory(Long articleId, Long categoryId);

    void removeVideo(Long articleId, Long videoId);

    void removeCategory(Long articleId, Long categoryId);

    void delete(Long articleId);
}
