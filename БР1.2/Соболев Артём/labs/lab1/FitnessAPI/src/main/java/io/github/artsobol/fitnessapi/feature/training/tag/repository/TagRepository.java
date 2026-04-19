package io.github.artsobol.fitnessapi.feature.training.tag.repository;

import io.github.artsobol.fitnessapi.feature.training.tag.entity.Tag;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface TagRepository extends JpaRepository<Tag, Long> {

    Optional<Tag> findBySlug(String slug);

    boolean existsBySlug(String slug);
}
