package io.github.artsobol.fitnessapi.feature.video.repository;

import io.github.artsobol.fitnessapi.feature.video.entity.Video;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface VideoRepository extends JpaRepository<Video, Long> {

    boolean existsByUrl(String url);
}
