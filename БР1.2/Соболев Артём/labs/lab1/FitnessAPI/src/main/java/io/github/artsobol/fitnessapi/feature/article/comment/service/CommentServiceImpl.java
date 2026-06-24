package io.github.artsobol.fitnessapi.feature.article.comment.service;

import io.github.artsobol.fitnessapi.exception.http.NotFoundException;
import io.github.artsobol.fitnessapi.feature.article.article.entity.Article;
import io.github.artsobol.fitnessapi.feature.article.article.service.ArticleFinder;
import io.github.artsobol.fitnessapi.feature.article.comment.dto.request.CreateCommentRequest;
import io.github.artsobol.fitnessapi.feature.article.comment.dto.request.UpdateCommentRequest;
import io.github.artsobol.fitnessapi.feature.article.comment.dto.response.CommentResponse;
import io.github.artsobol.fitnessapi.feature.article.comment.entity.Comment;
import io.github.artsobol.fitnessapi.feature.article.comment.mapper.CommentMapper;
import io.github.artsobol.fitnessapi.feature.article.comment.repository.CommentRepository;
import io.github.artsobol.fitnessapi.feature.user.entity.User;
import io.github.artsobol.fitnessapi.feature.user.service.UserFinder;
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
public class CommentServiceImpl implements CommentService {

    private final CommentRepository repository;
    private final CommentMapper mapper;
    private final UserFinder userFinder;
    private final ArticleFinder articleFinder;

    @Override
    @Transactional(readOnly = true)
    public Slice<CommentResponse> getArticleComments(Long articleId, Pageable pageable) {
        log.debug(
                "Fetching comment articleId={} page={} size={} sort={}",
                articleId,
                pageable.getPageNumber(),
                pageable.getPageSize(),
                pageable.getSort()
        );
        return repository.findByArticleIdAndIsActiveTrue(articleId, pageable).map(mapper::toResponse);
    }

    @Override
    @Transactional
    @PreAuthorize("isAuthenticated() and #userId == authentication.principal.userId")
    public CommentResponse createComment(Long userId, Long articleId, CreateCommentRequest request) {
        log.info("Creating comment articleId={} userId={}", articleId, userId);
        User user = userFinder.findByIdOrThrow(userId);
        Article article = articleFinder.findByIdOrThrow(articleId);

        Comment entity = Comment.create(user, article, request.comment());
        repository.save(entity);

        log.info("Comment created commentId={} articleId={} userId={}", entity.getId(), article.getId(), user.getId());
        return mapper.toResponse(entity);
    }

    @Override
    @Transactional
    @PreAuthorize("hasAuthority('ADMIN') or @commentAccess.canEdit(#commentId, authentication)")
    public CommentResponse updateComment(Long commentId, Long userId, UpdateCommentRequest request) {
        log.info("Updating comment commentId={} userId={}", commentId, userId);
        Comment entity = getById(commentId);
        entity.updateComment(request.comment());

        log.info("Comment updated commentId={} userId={}", entity.getId(), userId);
        return mapper.toResponse(entity);
    }

    @Override
    @Transactional
    @PreAuthorize("hasAuthority('ADMIN') or @commentAccess.canEdit(#commentId, authentication)")
    public void deactivateComment(Long commentId, Long userId) {
        log.info("Deactivating comment commentId={} userId={}", commentId, userId);
        Comment entity = getById(commentId);
        entity.deactivate();
        log.info("Comment deactivated commentId={} userId={}", entity.getId(), userId);
    }

    private Comment getById(Long commentId) {
        log.debug("Fetching comment commentId={}", commentId);
        return repository.findByIdAndIsActiveTrue(commentId)
                .orElseThrow(() -> new NotFoundException("{comment.id.not.found}", commentId));
    }
}
