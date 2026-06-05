package io.github.artsobol.trainingservice.integration.media.projection;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "media_video_catalog")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class MediaVideoCatalog {

    @Id
    @Getter
    private Long id;

    @Getter
    @Column(name = "title", nullable = false)
    private String title;

    @Getter
    @Column(name = "url", nullable = false)
    private String url;

    @Getter
    @Column(name = "is_active", nullable = false)
    private boolean active;

    public static MediaVideoCatalog create(Long id) {
        MediaVideoCatalog entity = new MediaVideoCatalog();
        entity.id = id;
        return entity;
    }

    public void applySnapshot(String title, String url, boolean active) {
        this.title = title;
        this.url = url;
        this.active = active;
    }
}
