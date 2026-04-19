package io.github.artsobol.fitnessapi.feature.training.favourite.mapper;

import io.github.artsobol.fitnessapi.config.persistence.MapStructConfig;
import io.github.artsobol.fitnessapi.feature.training.favourite.dto.response.TrainingFavouriteResponse;
import io.github.artsobol.fitnessapi.feature.training.favourite.entity.TrainingFavourite;
import io.github.artsobol.fitnessapi.feature.training.training.mapper.TrainingMapper;
import org.mapstruct.BeanMapping;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(config = MapStructConfig.class, uses = {TrainingMapper.class})
public interface TrainingFavouriteMapper {

    @BeanMapping(ignoreByDefault = true)
    @Mapping(target = "training")
    @Mapping(target = "createdAt")
    TrainingFavouriteResponse toResponse(TrainingFavourite entity);
}
