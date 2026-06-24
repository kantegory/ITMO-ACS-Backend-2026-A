package io.github.artsobol.fitnessapi.feature.article.comment.entity;

import io.github.artsobol.fitnessapi.feature.article.article.entity.Article;
import io.github.artsobol.fitnessapi.feature.user.entity.User;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EntityListeners;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.Instant;

@Entity
@Table(name = "comment")
@EntityListeners(AuditingEntityListener.class)
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Comment {

    @Id
    @Getter
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Getter
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Getter
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "article_id", nullable = false)
    private Article article;

    @Getter
    @Column(name = "comment", nullable = false)
    private String comment;

    @Getter
    @Column(name = "is_active", nullable = false)
    private boolean isActive = true;

    @Getter
    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Getter
    @LastModifiedDate
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    public static Comment create(User user, Article article, String comment) {
        Comment entity = new Comment();
        entity.user = user;
        entity.article = article;
        entity.updateComment(comment);

        return entity;
    }

    public void deactivate() {
        this.isActive = false;
    }

    public void updateComment(String comment) {
        if (comment == null || comment.isBlank()) {
            throw new IllegalArgumentException("comment must not be blank");
        }
        this.comment = comment;
    }
}
