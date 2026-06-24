package io.github.artsobol.fitnessapi.feature.training.exercise.mapper;

import io.github.artsobol.fitnessapi.config.persistence.MapStructConfig;
import io.github.artsobol.fitnessapi.feature.exercise.mapper.ExerciseMapper;
import io.github.artsobol.fitnessapi.feature.training.exercise.dto.response.TrainingExerciseResponse;
import io.github.artsobol.fitnessapi.feature.training.exercise.entity.TrainingExercise;
import org.mapstruct.BeanMapping;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(config = MapStructConfig.class, uses = {ExerciseMapper.class})
public interface TrainingExerciseMapper {

    @BeanMapping(ignoreByDefault = true)
    @Mapping(target = "id")
    @Mapping(target = "exercise")
    @Mapping(target = "orderIndex")
    TrainingExerciseResponse toResponse(TrainingExercise entity);
}
