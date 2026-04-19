package io.github.artsobol.fitnessapi.feature.training.type.mapper;

import io.github.artsobol.fitnessapi.config.persistence.MapStructConfig;
import io.github.artsobol.fitnessapi.feature.training.type.dto.response.TypeResponse;
import io.github.artsobol.fitnessapi.feature.training.type.entity.Type;
import org.mapstruct.BeanMapping;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(config = MapStructConfig.class)
public interface TypeMapper {

    @BeanMapping(ignoreByDefault = true)
    @Mapping(target = "id")
    @Mapping(target = "name")
    @Mapping(target = "slug")
    TypeResponse toResponse(Type entity);
}
