package io.github.artsobol.fitnessapi.feature.training.tag.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EntityListeners;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.Instant;

@Entity
@Table(name = "tag")
@EntityListeners(AuditingEntityListener.class)
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Tag {

    @Id
    @Getter
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Getter
    @Column(name = "name", nullable = false, length = 30)
    private String name;

    @Getter
    @Column(name = "slug", nullable = false, unique = true, length = 30)
    private String slug;

    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @LastModifiedDate
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    public static Tag create(String name, String slug) {
        Tag entity = new Tag();
        entity.updateName(name);
        entity.updateSlug(slug);

        return entity;
    }

    public void updateName(String name) {
        if (name == null || name.isBlank()) {
            throw new IllegalArgumentException("name must no be blank");
        }
        this.name = name;
    }

    public void updateSlug(String slug) {
        if (slug == null || slug.isBlank()) {
            throw new IllegalArgumentException("slug must not be blank");
        }
        this.slug = slug;
    }

    public void applyUpdate(String name, String slug) {
        if (name != null) {
            updateName(name);
        }
        if (slug != null) {
            updateSlug(slug);
        }
    }
}
