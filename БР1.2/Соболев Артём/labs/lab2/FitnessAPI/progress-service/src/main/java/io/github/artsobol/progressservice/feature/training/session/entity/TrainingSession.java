package io.github.artsobol.progressservice.feature.training.session.entity;

import io.github.artsobol.progressservice.feature.training.sessionexercise.entity.TrainingSessionExercise;
import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.EntityListeners;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OrderBy;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "training_session")
@EntityListeners(AuditingEntityListener.class)
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class TrainingSession {

    @Id
    @Getter
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Getter
    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Getter
    @Column(name = "training_id", nullable = false)
    private Long trainingId;

    @Getter
    @Enumerated(EnumType.STRING)
    @Column(name = "training_status", nullable = false)
    private TrainingStatus trainingStatus;

    @Getter
    @Column(name = "started_at")
    private Instant startedAt;

    @Getter
    @Column(name = "completed_at")
    private Instant completedAt;

    @Getter
    @OneToMany(mappedBy = "trainingSession", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("id ASC")
    private List<TrainingSessionExercise> exercises = new ArrayList<>();

    public static TrainingSession create(Long userId, Long trainingId) {
        TrainingSession entity = new TrainingSession();
        entity.setUserId(userId);
        entity.setTrainingId(trainingId);
        entity.trainingStatus = TrainingStatus.IN_PROGRESS;
        entity.startedAt = Instant.now();

        return entity;
    }

    public void complete() {
        this.trainingStatus = TrainingStatus.COMPLETED;
        this.completedAt = Instant.now();
    }

    public void abandon() {
        this.trainingStatus = TrainingStatus.ABANDONED;
        this.completedAt = Instant.now();
    }

    public void addExercise(Long trainingExerciseId) {
        TrainingSessionExercise entity = TrainingSessionExercise.create(this, trainingExerciseId);
        exercises.add(entity);
    }

    private void setUserId(Long userId) {
        if (userId == null) {
            throw new IllegalArgumentException("userId must not be null");
        }
        this.userId = userId;
    }

    private void setTrainingId(Long trainingId) {
        if (trainingId == null) {
            throw new IllegalArgumentException("trainingId must not be null");
        }
        this.trainingId = trainingId;
    }
}
