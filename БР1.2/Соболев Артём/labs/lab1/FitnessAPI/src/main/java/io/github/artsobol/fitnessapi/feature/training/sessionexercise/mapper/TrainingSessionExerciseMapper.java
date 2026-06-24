package io.github.artsobol.fitnessapi.feature.training.sessionexercise.mapper;

import io.github.artsobol.fitnessapi.config.persistence.MapStructConfig;
import io.github.artsobol.fitnessapi.feature.training.exercise.mapper.TrainingExerciseMapper;
import io.github.artsobol.fitnessapi.feature.training.session.mapper.TrainingSessionMapper;
import io.github.artsobol.fitnessapi.feature.training.sessionexercise.dto.response.TrainingSessionExerciseResponse;
import io.github.artsobol.fitnessapi.feature.training.sessionexercise.entity.TrainingSessionExercise;
import org.mapstruct.BeanMapping;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(config = MapStructConfig.class, uses = {TrainingSessionMapper.class, TrainingExerciseMapper.class})
public interface TrainingSessionExerciseMapper {

    @BeanMapping(ignoreByDefault = true)
    @Mapping(target = "id")
    @Mapping(target = "trainingSession")
    @Mapping(target = "trainingExercise")
    @Mapping(target = "exerciseStatus")
    @Mapping(target = "completedAt")
    TrainingSessionExerciseResponse toResponse(TrainingSessionExercise entity);
}
