package io.github.artsobol.fitnessapi.feature.article.article.service;

import io.github.artsobol.fitnessapi.exception.http.NotFoundException;
import io.github.artsobol.fitnessapi.feature.article.article.dto.request.CreateArticleRequest;
import io.github.artsobol.fitnessapi.feature.article.article.dto.request.UpdateArticleRequest;
import io.github.artsobol.fitnessapi.feature.article.article.dto.response.ArticleResponse;
import io.github.artsobol.fitnessapi.feature.article.article.entity.Article;
import io.github.artsobol.fitnessapi.feature.article.article.entity.Category;
import io.github.artsobol.fitnessapi.feature.article.article.mapper.ArticleMapper;
import io.github.artsobol.fitnessapi.feature.article.article.repository.ArticleRepository;
import io.github.artsobol.fitnessapi.feature.user.entity.User;
import io.github.artsobol.fitnessapi.feature.user.service.UserFinder;
import io.github.artsobol.fitnessapi.feature.video.entity.Video;
import io.github.artsobol.fitnessapi.feature.video.service.VideoFinder;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Slice;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
public class ArticleServiceImpl implements ArticleService, ArticleFinder {

    private final ArticleMapper mapper;
    private final VideoFinder videoFinder;
    private final CategoryFinder categoryFinder;
    private final ArticleRepository repository;
    private final UserFinder userFinder;

    @Override
    @Transactional(readOnly = true)
    public ArticleResponse getById(Long id) {
        Article entity = findByIdOrThrow(id);
        return mapper.toResponse(entity);
    }

    @Override
    @Transactional(readOnly = true)
    public Slice<ArticleResponse> getAll(Pageable pageable) {
        log.debug(
                "Fetching articles page={} size={} sort={}",
                pageable.getPageNumber(),
                pageable.getPageSize(),
                pageable.getSort()
        );
        return repository.findAll(pageable).map(mapper::toResponse);
    }

    @Override
    @Transactional
    @PreAuthorize("hasAnyAuthority('TRAINER', 'ADMIN') and #userId == authentication.principal.userId")
    public ArticleResponse create(CreateArticleRequest request, Long userId) {
        log.info("Creating article title={}", request.title());
        User user = userFinder.findByIdOrThrow(userId);
        Article entity = Article.create(user, request.title(), request.description());
        repository.save(entity);

        log.info("Created article articleId={} authorId={}", entity.getId(), entity.getAuthor().getId());
        return mapper.toResponse(entity);
    }

    @Override
    @Transactional
    @PreAuthorize("hasAuthority('ADMIN') or @articleAccess.canEdit(#articleId, authentication)")
    public ArticleResponse update(UpdateArticleRequest request, Long articleId) {
        log.info("Updating article articleId={}", articleId);
        Article entity = findByIdOrThrow(articleId);
        entity.applyPatch(request.title(), request.description());

        log.info("Article updated articleId={}", articleId);
        return mapper.toResponse(entity);
    }

    @Override
    @Transactional
    @PreAuthorize("hasAuthority('ADMIN') or @articleAccess.canEdit(#articleId, authentication)")
    public ArticleResponse addVideo(Long articleId, Long videoId) {
        log.info("Adding video videoId={} articleId={}", videoId, articleId);
        Article entity = findByIdOrThrow(articleId);
        Video video = videoFinder.findByIdOrThrow(videoId);
        entity.addVideo(video);

        log.info("Video added videoId={} articleId={}", videoId, articleId);
        return mapper.toResponse(entity);
    }

    @Override
    @Transactional
    @PreAuthorize("hasAuthority('ADMIN') or @articleAccess.canEdit(#articleId, authentication)")
    public ArticleResponse addCategory(Long articleId, Long categoryId) {
        log.info("Adding category categoryId={} articleId={}", categoryId, articleId);
        Article entity = findByIdOrThrow(articleId);
        Category category = categoryFinder.findByIdOrThrow(categoryId);
        entity.addCategory(category);

        log.info("Category added categoryId={} articleId={}", categoryId, articleId);
        return mapper.toResponse(entity);
    }

    @Override
    @Transactional
    @PreAuthorize("hasAuthority('ADMIN') or @articleAccess.canEdit(#articleId, authentication)")
    public void removeVideo(Long articleId, Long videoId) {
        log.info("Removing video videoId={} articleId={}", videoId, articleId);
        Article entity = findByIdOrThrow(articleId);
        Video video = videoFinder.findByIdOrThrow(videoId);
        entity.removeVideo(video);
        log.info("Video removed videoId={} articleId={}", videoId, articleId);
    }

    @Override
    @Transactional
    @PreAuthorize("hasAuthority('ADMIN') or @articleAccess.canEdit(#articleId, authentication)")
    public void removeCategory(Long articleId, Long categoryId) {
        log.info("Removing category categoryId={} articleId={}", categoryId, articleId);
        Article entity = findByIdOrThrow(articleId);
        Category category = categoryFinder.findByIdOrThrow(categoryId);
        entity.removeCategory(category);
        log.info("Category removed categoryId={} articleId={}", categoryId, articleId);
    }

    @Override
    @Transactional
    @PreAuthorize("hasAuthority('ADMIN') or @articleAccess.canEdit(#articleId, authentication)")
    public void delete(Long articleId) {
        log.info("Deleting article articleId={}", articleId);
        Article entity = findByIdOrThrow(articleId);
        repository.delete(entity);
        log.info("Article deleted articleId={}", articleId);
    }

    @Override
    public Article findByIdOrThrow(Long articleId) {
        log.debug("Fetching article articleId={}", articleId);
        return repository.findById(articleId)
                .orElseThrow(() -> new NotFoundException("{article.id.not.found}", articleId));
    }
}
