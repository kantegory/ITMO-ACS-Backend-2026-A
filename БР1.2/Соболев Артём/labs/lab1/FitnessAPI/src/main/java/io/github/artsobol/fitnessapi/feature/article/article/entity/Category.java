package io.github.artsobol.fitnessapi.feature.article.article.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EntityListeners;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.Instant;

@Entity
@Table(name = "category", indexes = {@Index(name = "idx_category_slug", columnList = "slug")})
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@EntityListeners(AuditingEntityListener.class)
public class Category {

    @Id
    @Getter
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Getter
    @Column(name = "name", length = 40, nullable = false)
    private String name;

    @Getter
    @Column(name = "slug", length = 40, nullable = false, unique = true)
    private String slug;

    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @LastModifiedDate
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    public static Category create(String name, String slug) {
        Category entity = new Category();
        entity.updateName(name);
        entity.updateSlug(slug);

        return entity;
    }

    public void applyPatch(String name, String slug) {
        if (slug != null) {
            this.updateSlug(slug);
        }
        if (name != null) {
            this.updateName(name);
        }
    }

    public void updateName(String name) {
        if (name == null || name.isBlank()) {
            throw new IllegalArgumentException("name must not be blank");
        }
        this.name = name;
    }

    public void updateSlug(String slug) {
        if (slug == null || slug.isBlank()) {
            throw new IllegalArgumentException("slug must not be blank");
        }
        this.slug = slug;
    }
}
