package io.github.artsobol.fitnessapi.feature.training.sessionexercise.entity;

import io.github.artsobol.fitnessapi.feature.training.exercise.entity.TrainingExercise;
import io.github.artsobol.fitnessapi.feature.training.session.entity.TrainingSession;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EntityListeners;
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
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.Instant;

@Entity
@Table(name = "training_session_exercise")
@EntityListeners(AuditingEntityListener.class)
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
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "training_exercise_id", nullable = false)
    private TrainingExercise trainingExercise;

    @Getter
    @Enumerated(EnumType.STRING)
    @Column(name = "exercise_status", nullable = false)
    private ExerciseStatus exerciseStatus = ExerciseStatus.NOT_STARTED;

    @Getter
    @Column(name = "completed_at")
    private Instant completedAt;

    public static TrainingSessionExercise create(TrainingSession trainingSession, TrainingExercise trainingExercise) {
        TrainingSessionExercise entity = new TrainingSessionExercise();
        entity.assignTrainingSession(trainingSession);
        entity.assignTrainingExercise(trainingExercise);

        return entity;
    }

    public void start() {
        ensureNotFinished();
        this.exerciseStatus = ExerciseStatus.IN_PROGRESS;
        this.completedAt = null;
    }

    public void complete() {
        ensureNotFinished();
        this.exerciseStatus = ExerciseStatus.COMPLETED;
        this.completedAt = Instant.now();
    }

    public void skip() {
        ensureNotFinished();
        this.exerciseStatus = ExerciseStatus.SKIPPED;
        this.completedAt = Instant.now();
    }

    public boolean isFinished() {
        return exerciseStatus == ExerciseStatus.COMPLETED || exerciseStatus == ExerciseStatus.SKIPPED;
    }

    private void assignTrainingSession(TrainingSession trainingSession) {
        if (trainingSession == null) {
            throw new IllegalArgumentException("trainingSession must not be null");
        }
        this.trainingSession = trainingSession;
    }

    private void assignTrainingExercise(TrainingExercise trainingExercise) {
        if (trainingExercise == null) {
            throw new IllegalArgumentException("trainingExercise must not be null");
        }
        this.trainingExercise = trainingExercise;
    }

    private void ensureNotFinished() {
        if (isFinished()) {
            throw new IllegalStateException("training session exercise is already finished");
        }
    }
}
