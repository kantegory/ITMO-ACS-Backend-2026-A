package io.github.artsobol.fitnessapi.feature.training.tag.mapper;

import io.github.artsobol.fitnessapi.config.persistence.MapStructConfig;
import io.github.artsobol.fitnessapi.feature.training.tag.dto.response.TagResponse;
import io.github.artsobol.fitnessapi.feature.training.tag.entity.Tag;
import org.mapstruct.BeanMapping;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(config = MapStructConfig.class)
public interface TagMapper {

    @BeanMapping(ignoreByDefault = true)
    @Mapping(target = "id")
    @Mapping(target = "name")
    @Mapping(target = "slug")
    TagResponse toResponse(Tag entity);
}
