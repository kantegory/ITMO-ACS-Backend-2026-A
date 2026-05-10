package io.github.artsobol.trainingservice.feature.training.exercise.entity;

import io.github.artsobol.trainingservice.feature.training.training.entity.Training;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
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

@Entity
@Table(
        name = "training_exercise"
)
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class TrainingExercise {

    @Id
    @Getter
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Getter
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "training_id")
    private Training training;

    @Getter
    @Column(name = "exercise_id", nullable = false)
    private Long exerciseId;

    @Getter
    @Column(name = "order_index", nullable = false)
    private int orderIndex;

    public static TrainingExercise create(Training training, Long exerciseId, int orderIndex) {
        TrainingExercise entity = new TrainingExercise();
        entity.updateTraining(training);
        entity.updateExerciseId(exerciseId);
        entity.updateOrderIndex(orderIndex);

        return entity;
    }

    public void updateExerciseId(Long exerciseId) {
        if (exerciseId == null) {
            throw new IllegalArgumentException("exerciseId must not be null");
        }
        this.exerciseId = exerciseId;
    }

    public void updateTraining(Training training) {
        if (training == null) {
            throw new IllegalArgumentException("training must not be blank");
        }
        this.training = training;
    }

    public void updateOrderIndex(int orderIndex) {
        if (orderIndex < 0) {
            throw new IllegalArgumentException("orderIndex must be positive");
        }
        this.orderIndex = orderIndex;
    }

}
