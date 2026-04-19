package io.github.artsobol.fitnessapi.feature.article.comment.repository;

import io.github.artsobol.fitnessapi.feature.article.comment.entity.Comment;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Slice;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface CommentRepository extends JpaRepository<Comment, Long> {

    Slice<Comment> findByArticleIdAndIsActiveTrue(Long articleId, Pageable pageable);

    Optional<Comment> findByIdAndIsActiveTrue(Long id);

    boolean existsByIdAndUserId(Long id, Long userId);
}
