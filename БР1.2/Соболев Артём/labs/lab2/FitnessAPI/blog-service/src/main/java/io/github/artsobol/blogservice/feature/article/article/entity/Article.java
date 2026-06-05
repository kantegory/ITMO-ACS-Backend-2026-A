package io.github.artsobol.blogservice.feature.article.article.entity;

import jakarta.persistence.CollectionTable;
import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Entity;
import jakarta.persistence.EntityListeners;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.JoinTable;
import jakarta.persistence.ManyToMany;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedBy;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.Instant;
import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "article")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@EntityListeners(AuditingEntityListener.class)
public class Article {

    @Id
    @Getter
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Getter
    @Column(name = "title", nullable = false, length = 100)
    private String title;

    @Getter
    @Column(name = "description")
    private String description;

    @Getter
    @ManyToMany
    @JoinTable(name = "article_category", joinColumns = @JoinColumn(name = "article_id"),
            inverseJoinColumns = @JoinColumn(name = "category_id"))
    private Set<Category> categories = new HashSet<>();

    @Getter
    @ElementCollection
    @CollectionTable(name = "article_video", joinColumns = @JoinColumn(name = "article_id"))
    @Column(name = "video_id", nullable = false)
    private Set<Long> videoIds = new HashSet<>();

    @Getter
    @Column(name = "author_id", nullable = false, updatable = false)
    private Long authorId;

    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @LastModifiedDate
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @LastModifiedBy
    @Column(name = "last_modified_by")
    private Long lastModifiedBy;

    public static Article create(Long authorId, String title, String description) {
        Article entity = new Article();
        entity.setAuthorId(authorId);
        entity.updateTitle(title);
        entity.updateDescription(description);

        return entity;
    }
    
    public void applyPatch(String title, String description) {
        if (title != null) {
            this.updateTitle(title);
        }
        if (description != null) {
            this.updateDescription(description);
        }
    }

    public void updateTitle(String title) {
        if (title == null || title.isBlank()) {
            throw new IllegalArgumentException("title must not be blank");
        }
        this.title = title;
    }

    public void updateDescription(String description) {
        this.description = description;
    }

    public void addVideo(Long videoId) {
        if (videoId == null) {
            throw new IllegalArgumentException("videoId must not be null");
        }
        this.videoIds.add(videoId);
    }

    public void addCategory(Category category) {
        if (category == null) {
            throw new IllegalArgumentException("category must not be null");
        }
        this.categories.add(category);
    }

    public void removeVideo(Long videoId) {
        if (videoId == null) {
            throw new IllegalArgumentException("videoId must not be null");
        }
        if (!this.videoIds.contains(videoId)) {
            throw new IllegalArgumentException("video not in article with id " + id);
        }
        this.videoIds.remove(videoId);
    }

    public void removeCategory(Category category) {
        if (category == null) {
            throw new IllegalArgumentException("category must not be null");
        }
        if (!this.categories.contains(category)) {
            throw new IllegalArgumentException("category not in article with id " + id);
        }
        this.categories.remove(category);
    }

    private void setAuthorId(Long authorId) {
        if (authorId == null) {
            throw new IllegalArgumentException("authorId must not be null");
        }
        this.authorId = authorId;
    }
}
