package io.github.artsobol.trainingservice.feature.training.training.mapper;

import io.github.artsobol.common.config.persistence.MapStructConfig;
import io.github.artsobol.trainingservice.feature.training.exercise.mapper.TrainingExerciseMapper;
import io.github.artsobol.trainingservice.feature.training.tag.mapper.TagMapper;
import io.github.artsobol.trainingservice.feature.training.training.dto.response.TrainingResponse;
import io.github.artsobol.trainingservice.feature.training.training.entity.Training;
import io.github.artsobol.trainingservice.feature.training.type.mapper.TypeMapper;
import org.mapstruct.BeanMapping;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(config = MapStructConfig.class, uses = {TrainingExerciseMapper.class, TagMapper.class, TypeMapper.class})
public interface TrainingMapper {

    @BeanMapping(ignoreByDefault = true)
    @Mapping(target = "id")
    @Mapping(target = "title")
    @Mapping(target = "authorId")
    @Mapping(target = "description")
    @Mapping(target = "exercises")
    @Mapping(target = "tags")
    @Mapping(target = "types")
    @Mapping(target = "trainingLevel")
    @Mapping(target = "createdAt")
    @Mapping(target = "updatedAt")
    TrainingResponse toResponse(Training entity);
}
