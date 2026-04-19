package io.github.artsobol.fitnessapi.feature.article.comment.security;

import io.github.artsobol.fitnessapi.feature.article.comment.repository.CommentRepository;
import io.github.artsobol.fitnessapi.security.user.UserPrincipal;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Component;

@Component("commentAccess")
@RequiredArgsConstructor
public class CommentAccess {

    private final CommentRepository commentRepository;

    public boolean canEdit(Long commentId, Authentication authentication) {

        Object principal = authentication.getPrincipal();
        if (!(principal instanceof UserPrincipal userPrincipal)) {
            return false;
        }
        return commentRepository.existsByIdAndUserId(commentId, userPrincipal.userId());
    }
}
