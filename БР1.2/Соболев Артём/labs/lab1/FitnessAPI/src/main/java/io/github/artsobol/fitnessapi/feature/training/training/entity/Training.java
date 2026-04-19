package io.github.artsobol.fitnessapi.feature.training.training.entity;

import io.github.artsobol.fitnessapi.feature.exercise.entity.Exercise;
import io.github.artsobol.fitnessapi.feature.training.exercise.entity.TrainingExercise;
import io.github.artsobol.fitnessapi.feature.training.tag.entity.Tag;
import io.github.artsobol.fitnessapi.feature.training.type.entity.Type;
import io.github.artsobol.fitnessapi.feature.user.entity.User;
import jakarta.persistence.CascadeType;
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
import jakarta.persistence.OneToMany;
import jakarta.persistence.OrderBy;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedBy;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.Instant;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Entity
@Table(name = "training")
@EntityListeners(AuditingEntityListener.class)
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Training {

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
    @JoinTable(name = "training_tag", joinColumns = @JoinColumn(name = "training_id", referencedColumnName = "id"),
            inverseJoinColumns = @JoinColumn(name = "tag_id", referencedColumnName = "id"), indexes = {
            @Index(name = "idx_training_tag_training", columnList = "training_id"),
            @Index(name = "idx_training_tag_tag", columnList = "tag_id")
    })
    private Set<Tag> tags = new HashSet<>();

    @Getter
    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(name = "training_type", joinColumns = @JoinColumn(name = "training_id", referencedColumnName = "id"),
            inverseJoinColumns = @JoinColumn(name = "type_id", referencedColumnName = "id"), indexes = {
            @Index(name = "idx_training_type_training", columnList = "training_id"),
            @Index(name = "idx_training_type_type", columnList = "type_id")
    })
    private Set<Type> types = new HashSet<>();

    @Getter
    @OneToMany(mappedBy = "training", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("orderIndex ASC")
    private List<TrainingExercise> exercises = new ArrayList<>();

    @Getter
    @Enumerated(EnumType.STRING)
    @Column(name = "training_level", nullable = false)
    private TrainingLevel trainingLevel;

    @Getter
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "author_id", nullable = false, updatable = false)
    private User author;

    @LastModifiedBy
    @Column(name = "last_modified_by")
    private Long lastModifiedBy;

    @Getter
    @Column(name = "is_active", nullable = false)
    private boolean isActive = true;

    @Getter
    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Getter
    @LastModifiedDate
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    public static Training create(
            User author,
            String title,
            String description,
            TrainingLevel trainingLevel
    ) {
        Training entity = new Training();
        entity.setAuthor(author);
        entity.updateTitle(title);
        entity.updateDescription(description);
        entity.setTrainingLevel(trainingLevel);

        return entity;
    }
    
    public void applyPatch(String title, String description, TrainingLevel trainingLevel) {
        if (title != null) {
            this.updateTitle(title);
        }
        if (description != null) {
            this.updateDescription(description);
        }
        if (trainingLevel != null) {
            this.setTrainingLevel(trainingLevel);
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

    public void addTag(Tag tag) {
        if (tag == null) {
            throw new IllegalArgumentException("tag must not be null");
        }
        this.tags.add(tag);
    }

    public void removeTag(Tag tag) {
        if (tag == null) {
            throw new IllegalArgumentException("tag must not be null");
        }
        if (!this.tags.contains(tag)) {
            throw new IllegalArgumentException("tag not in training with id " + id);
        }
        this.tags.remove(tag);
    }

    public void addType(Type type) {
        if (type == null) {
            throw new IllegalArgumentException("type must not be null");
        }
        this.types.add(type);
    }

    public void removeType(Type type) {
        if (type == null) {
            throw new IllegalArgumentException("type must not be null");
        }
        if (!this.types.contains(type)) {
            throw new IllegalArgumentException("type not in training with id " + id);
        }
        this.types.remove(type);
    }

    public void addExercise(Exercise exercise) {
        ensureExerciseNotNull(exercise);

        int nextOrderIndex = exercises.size();

        TrainingExercise entity = TrainingExercise.create(this, exercise, nextOrderIndex);
        exercises.add(entity);
    }

    public void removeExercise(TrainingExercise exercise) {
        if (!exercises.contains(exercise)) {
            throw new IllegalArgumentException("Training not contains this exercise");
        }

        exercises.remove(exercise);
        reindexExercises();
    }

    private void reindexExercises() {
        for (int i = 0; i < exercises.size(); i++) {
            exercises.get(i).updateOrderIndex(i);
        }
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

    private static void ensureExerciseNotNull(Exercise exercise) {
        if (exercise == null) {
            throw new IllegalArgumentException("exercise must not be null");
        }
    }
}
