package io.github.artsobol.trainingservice.feature.exercise.entity;

import io.github.artsobol.trainingservice.feature.training.training.entity.TrainingLevel;
import jakarta.persistence.CollectionTable;
import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Entity;
import jakarta.persistence.EntityListeners;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
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
@Table(name = "exercise")
@EntityListeners(AuditingEntityListener.class)
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Exercise {

    @Id
    @Getter
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Getter
    @Column(name = "title", length = 50, nullable = false)
    private String title;

    @Getter
    @Column(name = "description")
    private String description;

    @Getter
    @ElementCollection
    @CollectionTable(
            name = "exercise_video",
            joinColumns = @JoinColumn(name = "exercise_id"),
            indexes = {
                    @Index(name = "idx_exercise_video_exercise", columnList = "exercise_id"),
                    @Index(name = "idx_exercise_video_video", columnList = "video_id")
            }
    )
    @Column(name = "video_id", nullable = false)
    private Set<Long> videoIds = new HashSet<>();

    @Getter
    @Enumerated(EnumType.STRING)
    @Column(name = "muscle_group", nullable = false)
    private MuscleGroup muscleGroup;

    @Getter
    @Enumerated(EnumType.STRING)
    @Column(name = "training_level", nullable = false)
    private TrainingLevel trainingLevel;

    @Getter
    @Column(name = "is_active", nullable = false)
    private boolean isActive = true;

    @Getter
    @Column(name = "author_id", nullable = false, updatable = false)
    private Long authorId;

    @LastModifiedBy
    @Column(name = "last_modified_by")
    private Long lastModifiedBy;

    @Getter
    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Getter
    @LastModifiedDate
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    public static Exercise create(
            Long authorId,
            String title,
            String description,
            MuscleGroup muscleGroup,
            TrainingLevel trainingLevel
    ) {
        Exercise entity = new Exercise();
        entity.setAuthorId(authorId);
        entity.updateTitle(title);
        entity.updateDescription(description);
        entity.setMuscleGroup(muscleGroup);
        entity.setTrainingLevel(trainingLevel);

        return entity;
    }

    public void applyPatch(String title, String description, MuscleGroup muscleGroup, TrainingLevel trainingLevel) {
        if (title != null) {
            updateTitle(title);
        }
        if (description != null) {
            updateDescription(description);
        }
        if (muscleGroup != null) {
            setMuscleGroup(muscleGroup);
        }
        if (trainingLevel != null) {
            setTrainingLevel(trainingLevel);
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

    public void deactivate() {
        this.isActive = false;
    }

    public void addVideo(Long videoId) {
        ensureVideoIdNotNull(videoId);
        this.videoIds.add(videoId);
    }

    public void removeVideo(Long videoId) {
        ensureVideoIdNotNull(videoId);
        if (!videoIds.contains(videoId)) {
            throw new IllegalArgumentException("Exercise not contain this video");
        }
        this.videoIds.remove(videoId);
    }

    public void setMuscleGroup(MuscleGroup muscleGroup) {
        if (muscleGroup == null) {
            throw new IllegalArgumentException("muscle group must not be null");
        }
        this.muscleGroup = muscleGroup;
    }

    public void setTrainingLevel(TrainingLevel trainingLevel) {
        if (trainingLevel == null) {
            throw new IllegalArgumentException("training Level must not be null");
        }
        this.trainingLevel = trainingLevel;
    }

    private void setAuthorId(Long authorId) {
        if (authorId == null) {
            throw new IllegalArgumentException("authorId must not be null");
        }
        this.authorId = authorId;
    }

    private static void ensureVideoIdNotNull(Long videoId) {
        if (videoId == null) {
            throw new IllegalArgumentException("videoId must not be null");
        }
    }
}
