package io.github.artsobol.fitnessapi.feature.exercise.entity;

import io.github.artsobol.fitnessapi.feature.training.training.entity.TrainingLevel;
import io.github.artsobol.fitnessapi.feature.user.entity.User;
import io.github.artsobol.fitnessapi.feature.video.entity.Video;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EntityListeners;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
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
    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(name = "exercise_video", joinColumns = @JoinColumn(name = "exercise_id", referencedColumnName = "id"),
            inverseJoinColumns = @JoinColumn(name = "video_id", referencedColumnName = "id"), indexes = {
            @Index(name = "idx_exercise_video_exercise", columnList = "exercise_id"),
            @Index(name = "idx_exercise_video_video", columnList = "video_id")
    })
    private Set<Video> videos = new HashSet<>();

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
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "author_id")
    private User author;

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
            User author,
            String title,
            String description,
            MuscleGroup muscleGroup,
            TrainingLevel trainingLevel
    ) {
        Exercise entity = new Exercise();
        entity.setAuthor(author);
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

    public void addVideo(Video video) {
        ensureVideoNotNull(video);
        this.videos.add(video);
    }

    public void removeVideo(Video video) {
        ensureVideoNotNull(video);
        if (!videos.contains(video)) {
            throw new IllegalArgumentException("Exercise not contain this video");
        }
        this.videos.remove(video);
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

    private void setAuthor(User author) {
        if (author == null) {
            throw new IllegalArgumentException("author must not be null");
        }
        this.author = author;
    }

    private static void ensureVideoNotNull(Video video) {
        if (video == null) {
            throw new IllegalArgumentException("video must not be null");
        }
    }
}
