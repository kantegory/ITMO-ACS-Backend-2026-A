package io.github.artsobol.fitnessapi.feature.article.article.security;

import io.github.artsobol.fitnessapi.feature.article.article.repository.ArticleRepository;
import io.github.artsobol.fitnessapi.security.user.UserPrincipal;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Component;

@Component("articleAccess")
@RequiredArgsConstructor
public class ArticleAccess {

    private final ArticleRepository articleRepository;

    public boolean canEdit(Long articleId, Authentication authentication) {
        Object principal = authentication.getPrincipal();
        if (!(principal instanceof UserPrincipal userPrincipal)) {
            return false;
        }
        return articleRepository.existsByIdAndAuthorId(articleId, userPrincipal.userId());
    }
}
