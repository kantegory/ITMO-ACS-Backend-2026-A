package io.github.artsobol.mediaservice.feature.video.repository;

import io.github.artsobol.mediaservice.feature.video.entity.Video;
import org.springframework.data.jpa.repository.JpaRepository;

public interface VideoRepository extends JpaRepository<Video, Long> {

    boolean existsByUrl(String url);
}
