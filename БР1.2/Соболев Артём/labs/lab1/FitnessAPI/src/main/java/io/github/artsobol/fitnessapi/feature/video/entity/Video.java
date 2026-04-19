package io.github.artsobol.fitnessapi.feature.video.entity;

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
@Table(name = "video")
@EntityListeners(AuditingEntityListener.class)
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Video {

    @Id
    @Getter
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Getter
    @Column(name = "url", unique = true, nullable = false)
    private String url;

    @Getter
    @Column(name = "title", nullable = false, length = 100)
    private String title;

    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant created_at;

    @LastModifiedDate
    @Column(name = "updated_at", nullable = false)
    private Instant updated_at;

    public static Video create(String url, String title) {
        Video entity = new Video();
        entity.changeTitle(title);
        entity.changeUrl(url);

        return entity;
    }

    public void applyPatch(String title, String url) {
        if (url != null) {
            this.changeUrl(url);
        }
        if (title != null) {
            this.changeTitle(title);
        }
    }

    public void changeTitle(String title) {
        if (title == null || title.isBlank()) {
            throw new IllegalArgumentException("title must not be blank");
        }
        this.title = title;
    }

    public void changeUrl(String url) {
        if (url == null || url.isBlank()) {
            throw new IllegalArgumentException("url must not be blank");
        }
        this.url = url;
    }
}
