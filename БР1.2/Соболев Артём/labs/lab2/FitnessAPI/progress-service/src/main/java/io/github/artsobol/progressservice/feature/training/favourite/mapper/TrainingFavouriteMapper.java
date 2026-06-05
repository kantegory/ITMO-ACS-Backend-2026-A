package io.github.artsobol.progressservice.feature.training.favourite.mapper;

import io.github.artsobol.common.config.persistence.MapStructConfig;
import io.github.artsobol.progressservice.feature.training.favourite.dto.response.TrainingFavouriteResponse;
import io.github.artsobol.progressservice.feature.training.favourite.entity.TrainingFavourite;
import org.mapstruct.BeanMapping;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(config = MapStructConfig.class)
public interface TrainingFavouriteMapper {

    @BeanMapping(ignoreByDefault = true)
    @Mapping(target = "trainingId")
    @Mapping(target = "userId")
    @Mapping(target = "createdAt")
    TrainingFavouriteResponse toResponse(TrainingFavourite entity);
}
