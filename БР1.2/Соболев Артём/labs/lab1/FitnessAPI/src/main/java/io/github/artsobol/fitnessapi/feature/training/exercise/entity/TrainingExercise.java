package io.github.artsobol.fitnessapi.feature.training.exercise.entity;

import io.github.artsobol.fitnessapi.feature.exercise.entity.Exercise;
import io.github.artsobol.fitnessapi.feature.training.training.entity.Training;
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
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "exercise_id")
    private Exercise exercise;

    @Getter
    @Column(name = "order_index", nullable = false)
    private int orderIndex;

    public static TrainingExercise create(Training training, Exercise exercise, int orderIndex) {
        TrainingExercise entity = new TrainingExercise();
        entity.updateTraining(training);
        entity.updateExercise(exercise);
        entity.updateOrderIndex(orderIndex);

        return entity;
    }

    public void updateExercise(Exercise exercise) {
        if (exercise == null) {
            throw new IllegalArgumentException("exercise must not be blank");
        }
        this.exercise = exercise;
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
