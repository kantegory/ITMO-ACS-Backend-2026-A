package io.github.artsobol.progressservice.integration.training.projection;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OrderBy;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

@Entity
@Table(name = "training_catalog")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class TrainingCatalog {

    @Id
    @Getter
    private Long id;

    @Getter
    @Column(name = "is_active", nullable = false)
    private boolean active;

    @Getter
    @OneToMany(mappedBy = "trainingCatalog", fetch = FetchType.EAGER, cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("orderIndex ASC")
    private List<TrainingCatalogExercise> exercises = new ArrayList<>();

    public static TrainingCatalog create(Long id) {
        TrainingCatalog entity = new TrainingCatalog();
        entity.id = id;
        return entity;
    }

    public void replaceSnapshot(boolean active, List<TrainingCatalogExerciseSnapshot> exerciseSnapshots) {
        this.active = active;
        this.exercises.clear();
        exerciseSnapshots.stream()
                .sorted(Comparator.comparingInt(TrainingCatalogExerciseSnapshot::orderIndex))
                .map(snapshot -> TrainingCatalogExercise.create(
                        this,
                        snapshot.trainingExerciseId(),
                        snapshot.exerciseId(),
                        snapshot.orderIndex()
                ))
                .forEach(this.exercises::add);
    }
}
