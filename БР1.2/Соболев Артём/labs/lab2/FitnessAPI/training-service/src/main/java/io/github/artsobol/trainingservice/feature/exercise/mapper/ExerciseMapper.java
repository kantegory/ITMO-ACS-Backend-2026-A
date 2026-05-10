package io.github.artsobol.trainingservice.feature.exercise.mapper;

import io.github.artsobol.common.config.persistence.MapStructConfig;
import io.github.artsobol.trainingservice.feature.exercise.dto.response.ExerciseResponse;
import io.github.artsobol.trainingservice.feature.exercise.entity.Exercise;
import org.mapstruct.BeanMapping;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(config = MapStructConfig.class)
public interface ExerciseMapper {

    @BeanMapping(ignoreByDefault = true)
    @Mapping(target = "id")
    @Mapping(target = "title")
    @Mapping(target = "description")
    @Mapping(target = "videoIds")
    @Mapping(target = "muscleGroup")
    @Mapping(target = "trainingLevel")
    @Mapping(target = "authorId")
    @Mapping(target = "createdAt")
    @Mapping(target = "updatedAt")
    ExerciseResponse toResponse(Exercise entity);
}
