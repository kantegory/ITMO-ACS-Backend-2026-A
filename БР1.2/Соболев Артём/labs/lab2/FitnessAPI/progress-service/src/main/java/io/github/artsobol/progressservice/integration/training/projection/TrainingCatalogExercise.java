package io.github.artsobol.progressservice.integration.training.projection;

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
@Table(name = "training_catalog_exercise")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class TrainingCatalogExercise {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "training_id")
    private TrainingCatalog trainingCatalog;

    @Getter
    @Column(name = "training_exercise_id", nullable = false)
    private Long trainingExerciseId;

    @Getter
    @Column(name = "exercise_id", nullable = false)
    private Long exerciseId;

    @Getter
    @Column(name = "order_index", nullable = false)
    private int orderIndex;

    public static TrainingCatalogExercise create(
            TrainingCatalog trainingCatalog,
            Long trainingExerciseId,
            Long exerciseId,
            int orderIndex
    ) {
        TrainingCatalogExercise entity = new TrainingCatalogExercise();
        entity.trainingCatalog = trainingCatalog;
        entity.trainingExerciseId = trainingExerciseId;
        entity.exerciseId = exerciseId;
        entity.orderIndex = orderIndex;
        return entity;
    }
}
