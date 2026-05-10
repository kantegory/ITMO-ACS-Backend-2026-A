package io.github.artsobol.trainingservice.feature.training.exercise.mapper;

import io.github.artsobol.common.config.persistence.MapStructConfig;
import io.github.artsobol.trainingservice.feature.training.exercise.dto.response.TrainingExerciseResponse;
import io.github.artsobol.trainingservice.feature.training.exercise.entity.TrainingExercise;
import org.mapstruct.BeanMapping;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(config = MapStructConfig.class)
public interface TrainingExerciseMapper {

    @BeanMapping(ignoreByDefault = true)
    @Mapping(target = "id")
    @Mapping(target = "exerciseId")
    @Mapping(target = "orderIndex")
    TrainingExerciseResponse toResponse(TrainingExercise entity);
}
