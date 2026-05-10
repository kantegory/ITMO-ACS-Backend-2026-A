package io.github.artsobol.progressservice.feature.training.sessionexercise.mapper;

import io.github.artsobol.common.config.persistence.MapStructConfig;
import io.github.artsobol.progressservice.feature.training.sessionexercise.dto.response.TrainingSessionExerciseResponse;
import io.github.artsobol.progressservice.feature.training.sessionexercise.entity.TrainingSessionExercise;
import org.mapstruct.BeanMapping;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(config = MapStructConfig.class)
public interface TrainingSessionExerciseMapper {

    @BeanMapping(ignoreByDefault = true)
    @Mapping(target = "id")
    @Mapping(target = "trainingSessionId", source = "trainingSession.id")
    @Mapping(target = "trainingExerciseId")
    @Mapping(target = "exerciseStatus")
    @Mapping(target = "completedAt")
    TrainingSessionExerciseResponse toResponse(TrainingSessionExercise entity);
}
