package io.github.artsobol.progressservice.feature.training.rating.mapper;

import io.github.artsobol.common.config.persistence.MapStructConfig;
import io.github.artsobol.progressservice.feature.training.rating.dto.response.TrainingRatingResponse;
import io.github.artsobol.progressservice.feature.training.rating.entity.TrainingRating;
import org.mapstruct.BeanMapping;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(config = MapStructConfig.class)
public interface TrainingRatingMapper {

    @BeanMapping(ignoreByDefault = true)
    @Mapping(target = "trainingId")
    @Mapping(target = "userId")
    @Mapping(target = "rating")
    @Mapping(target = "comment")
    @Mapping(target = "createdAt")
    TrainingRatingResponse toResponse(TrainingRating entity);
}
