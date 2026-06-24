package io.github.artsobol.fitnessapi.feature.training.rating.mapper;

import io.github.artsobol.fitnessapi.config.persistence.MapStructConfig;
import io.github.artsobol.fitnessapi.feature.training.rating.dto.response.TrainingRatingResponse;
import io.github.artsobol.fitnessapi.feature.training.rating.entity.TrainingRating;
import io.github.artsobol.fitnessapi.feature.user.mapper.UserMapper;
import org.mapstruct.BeanMapping;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(config = MapStructConfig.class, uses = {UserMapper.class})
public interface TrainingRatingMapper {

    @BeanMapping(ignoreByDefault = true)
    @Mapping(target = "user")
    @Mapping(target = "rating")
    @Mapping(target = "comment")
    @Mapping(target = "createdAt")
    TrainingRatingResponse toResponse(TrainingRating entity);
}
