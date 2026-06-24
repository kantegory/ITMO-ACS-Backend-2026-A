package io.github.artsobol.fitnessapi.feature.article.article.repository;

import io.github.artsobol.fitnessapi.feature.article.article.entity.Article;
import org.springframework.data.jpa.repository.JpaRepository;


public interface ArticleRepository extends JpaRepository<Article, Long> {

    boolean existsByIdAndAuthorId(Long articleId, Long authorId);
}
