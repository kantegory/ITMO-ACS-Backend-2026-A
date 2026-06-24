package io.github.artsobol.fitnessapi.feature.article.article.entity;

import io.github.artsobol.fitnessapi.feature.user.entity.User;
import io.github.artsobol.fitnessapi.feature.video.entity.Video;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EntityListeners;
import jakarta.persistence.FetchType;
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
    @ManyToMany
    @JoinTable(name = "article_video", joinColumns = @JoinColumn(name = "article_id"),
            inverseJoinColumns = @JoinColumn(name = "video_id"))
    private Set<Video> videos = new HashSet<>();

    @Getter
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "author_id", nullable = false, updatable = false)
    private User author;

    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @LastModifiedDate
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @LastModifiedBy
    @Column(name = "last_modified_by")
    private Long lastModifiedBy;

    public static Article create(User author, String title, String description) {
        Article entity = new Article();
        entity.setAuthor(author);
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

    public void addVideo(Video video) {
        if (video == null) {
            throw new IllegalArgumentException("video must not be null");
        }
        this.videos.add(video);
    }

    public void addCategory(Category category) {
        if (category == null) {
            throw new IllegalArgumentException("category must not be null");
        }
        this.categories.add(category);
    }

    public void removeVideo(Video video) {
        if (video == null) {
            throw new IllegalArgumentException("video must not be null");
        }
        if (!this.videos.contains(video)) {
            throw new IllegalArgumentException("video not in article with id " + id);
        }
        this.videos.remove(video);
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

    private void setAuthor(User author) {
        if (author == null) {
            throw new IllegalArgumentException("author must be not null");
        }
        this.author = author;
    }
}
