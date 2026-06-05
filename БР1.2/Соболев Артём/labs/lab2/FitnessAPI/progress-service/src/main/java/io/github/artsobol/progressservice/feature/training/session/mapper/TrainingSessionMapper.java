package io.github.artsobol.progressservice.feature.training.session.mapper;

import io.github.artsobol.common.config.persistence.MapStructConfig;
import io.github.artsobol.progressservice.feature.training.session.dto.response.TrainingSessionResponse;
import io.github.artsobol.progressservice.feature.training.session.entity.TrainingSession;
import org.mapstruct.BeanMapping;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(config = MapStructConfig.class)
public interface TrainingSessionMapper {

    @BeanMapping(ignoreByDefault = true)
    @Mapping(target = "id")
    @Mapping(target = "userId")
    @Mapping(target = "trainingId")
    @Mapping(target = "trainingStatus")
    @Mapping(target = "startedAt")
    @Mapping(target = "completedAt")
    TrainingSessionResponse toResponse(TrainingSession entity);
}
