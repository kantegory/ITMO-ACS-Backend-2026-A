package io.github.artsobol.progressservice.feature.training.sessionexercise.entity;

import io.github.artsobol.progressservice.feature.training.session.entity.TrainingSession;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Entity
@Table(name = "training_session_exercise")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class TrainingSessionExercise {

    @Id
    @Getter
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Getter
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "training_session_id", nullable = false)
    private TrainingSession trainingSession;

    @Getter
    @Column(name = "training_exercise_id", nullable = false)
    private Long trainingExerciseId;

    @Getter
    @Enumerated(EnumType.STRING)
    @Column(name = "exercise_status", nullable = false)
    private ExerciseStatus exerciseStatus = ExerciseStatus.NOT_STARTED;

    @Getter
    @Column(name = "completed_at")
    private Instant completedAt;

    public static TrainingSessionExercise create(TrainingSession trainingSession, Long trainingExerciseId) {
        TrainingSessionExercise entity = new TrainingSessionExercise();
        entity.updateTrainingSession(trainingSession);
        entity.updateTrainingExerciseId(trainingExerciseId);

        return entity;
    }

    public void start() {
        this.exerciseStatus = ExerciseStatus.IN_PROGRESS;
    }

    public void complete() {
        this.exerciseStatus = ExerciseStatus.COMPLETED;
        this.completedAt = Instant.now();
    }

    public void skip() {
        this.exerciseStatus = ExerciseStatus.SKIPPED;
        this.completedAt = Instant.now();
    }

    public boolean isFinished() {
        return exerciseStatus == ExerciseStatus.COMPLETED || exerciseStatus == ExerciseStatus.SKIPPED;
    }

    private void updateTrainingSession(TrainingSession trainingSession) {
        if (trainingSession == null) {
            throw new IllegalArgumentException("trainingSession must not be null");
        }
        this.trainingSession = trainingSession;
    }

    private void updateTrainingExerciseId(Long trainingExerciseId) {
        if (trainingExerciseId == null) {
            throw new IllegalArgumentException("trainingExerciseId must not be null");
        }
        this.trainingExerciseId = trainingExerciseId;
    }
}
