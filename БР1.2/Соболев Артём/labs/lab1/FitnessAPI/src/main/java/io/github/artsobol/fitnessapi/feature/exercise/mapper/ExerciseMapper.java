package io.github.artsobol.fitnessapi.feature.exercise.mapper;

import io.github.artsobol.fitnessapi.config.persistence.MapStructConfig;
import io.github.artsobol.fitnessapi.feature.exercise.dto.response.ExerciseResponse;
import io.github.artsobol.fitnessapi.feature.exercise.entity.Exercise;
import io.github.artsobol.fitnessapi.feature.user.mapper.UserMapper;
import io.github.artsobol.fitnessapi.feature.video.mapper.VideoMapper;
import org.mapstruct.BeanMapping;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(config = MapStructConfig.class, uses = {VideoMapper.class, UserMapper.class})
public interface ExerciseMapper {

    @BeanMapping(ignoreByDefault = true)
    @Mapping(target = "id")
    @Mapping(target = "title")
    @Mapping(target = "description")
    @Mapping(target = "videos")
    @Mapping(target = "muscleGroup")
    @Mapping(target = "trainingLevel")
    @Mapping(target = "author")
    @Mapping(target = "createdAt")
    @Mapping(target = "updatedAt")
    ExerciseResponse toResponse(Exercise entity);
}
