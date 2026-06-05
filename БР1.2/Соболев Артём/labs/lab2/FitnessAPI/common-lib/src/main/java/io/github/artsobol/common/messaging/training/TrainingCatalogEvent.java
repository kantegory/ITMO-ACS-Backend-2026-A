package io.github.artsobol.common.messaging.training;

import java.util.List;

public record TrainingCatalogEvent(
        Long trainingId,
        boolean active,
        List<TrainingCatalogExerciseEvent> exercises
) {
}
