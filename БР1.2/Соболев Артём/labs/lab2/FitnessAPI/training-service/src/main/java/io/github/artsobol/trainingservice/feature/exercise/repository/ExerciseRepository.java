package io.github.artsobol.trainingservice.feature.exercise.repository;

import io.github.artsobol.trainingservice.feature.exercise.entity.Exercise;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Slice;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface ExerciseRepository extends JpaRepository<Exercise, Long> {

    Optional<Exercise> findByIdAndIsActiveTrue(Long exerciseId);

    Slice<Exercise> findByIsActiveTrue(Pageable pageable);

    Slice<Exercise> findByIsActiveTrueAndTitleContainingIgnoreCase(String title, Pageable pageable);

    boolean existsByIdAndAuthorId(Long exerciseId, Long authorId);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query(value = "delete from exercise_video where video_id = :videoId", nativeQuery = true)
    int deleteVideoReferences(@Param("videoId") Long videoId);
}
