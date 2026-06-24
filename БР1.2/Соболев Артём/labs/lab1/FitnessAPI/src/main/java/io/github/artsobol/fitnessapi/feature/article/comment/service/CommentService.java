package io.github.artsobol.fitnessapi.feature.article.comment.service;

import io.github.artsobol.fitnessapi.feature.article.comment.dto.request.CreateCommentRequest;
import io.github.artsobol.fitnessapi.feature.article.comment.dto.request.UpdateCommentRequest;
import io.github.artsobol.fitnessapi.feature.article.comment.dto.response.CommentResponse;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Slice;

public interface CommentService {

    CommentResponse createComment(Long userId, Long articleId, CreateCommentRequest request);

    CommentResponse updateComment(Long commentId, Long userId, UpdateCommentRequest request);

    Slice<CommentResponse> getArticleComments(Long articleId, Pageable pageable);

    void deactivateComment(Long commentId, Long userId);
}
