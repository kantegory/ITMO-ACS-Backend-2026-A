package io.github.artsobol.fitnessapi.feature.training.session.mapper;

import io.github.artsobol.fitnessapi.config.persistence.MapStructConfig;
import io.github.artsobol.fitnessapi.feature.training.session.dto.response.TrainingSessionResponse;
import io.github.artsobol.fitnessapi.feature.training.session.entity.TrainingSession;
import io.github.artsobol.fitnessapi.feature.training.training.mapper.TrainingMapper;
import io.github.artsobol.fitnessapi.feature.user.mapper.UserMapper;
import org.mapstruct.BeanMapping;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(config = MapStructConfig.class, uses = {UserMapper.class, TrainingMapper.class})
public interface TrainingSessionMapper {

    @BeanMapping(ignoreByDefault = true)
    @Mapping(target = "id")
    @Mapping(target = "user")
    @Mapping(target = "training")
    @Mapping(target = "trainingStatus")
    @Mapping(target = "startedAt")
    @Mapping(target = "completedAt")
    TrainingSessionResponse toResponse(TrainingSession entity);
}
