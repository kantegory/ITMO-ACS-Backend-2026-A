package io.github.artsobol.fitnessapi.feature.training.session.entity;

import io.github.artsobol.fitnessapi.feature.training.exercise.entity.TrainingExercise;
import io.github.artsobol.fitnessapi.feature.training.sessionexercise.entity.TrainingSessionExercise;
import io.github.artsobol.fitnessapi.feature.training.training.entity.Training;
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
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
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
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Getter
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "training_id", nullable = false)
    private Training training;

    @Getter
    @OneToMany(mappedBy = "trainingSession", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("id ASC")
    private List<TrainingSessionExercise> exercises = new ArrayList<>();

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

    public static TrainingSession create(User user, Training training) {
        TrainingSession entity = new TrainingSession();
        entity.assignUser(user);
        entity.assignTraining(training);
        entity.trainingStatus = TrainingStatus.IN_PROGRESS;
        entity.startedAt = Instant.now();
        training.getExercises().forEach(entity::addExercise);

        return entity;
    }

    public void complete() {
        ensureInProgress();
        ensureAllExercisesFinished();
        this.trainingStatus = TrainingStatus.COMPLETED;
        this.completedAt = Instant.now();
    }

    public void abandon() {
        ensureInProgress();
        this.trainingStatus = TrainingStatus.ABANDONED;
        this.completedAt = Instant.now();
    }

    private void assignUser(User user) {
        if (user == null) {
            throw new IllegalArgumentException("user must not be null");
        }
        this.user = user;
    }

    private void assignTraining(Training training) {
        if (training == null) {
            throw new IllegalArgumentException("training must not be null");
        }
        this.training = training;
    }

    private void addExercise(TrainingExercise trainingExercise) {
        if (trainingExercise == null) {
            throw new IllegalArgumentException("trainingExercise must not be null");
        }
        this.exercises.add(TrainingSessionExercise.create(this, trainingExercise));
    }

    private void ensureInProgress() {
        if (trainingStatus != TrainingStatus.IN_PROGRESS) {
            throw new IllegalStateException("training session is already finished");
        }
    }

    private void ensureAllExercisesFinished() {
        boolean hasIncompleteExercises = exercises.stream()
                .anyMatch(exercise -> !exercise.isFinished());

        if (hasIncompleteExercises) {
            throw new IllegalStateException("all training session exercises must be finished");
        }
    }
}
