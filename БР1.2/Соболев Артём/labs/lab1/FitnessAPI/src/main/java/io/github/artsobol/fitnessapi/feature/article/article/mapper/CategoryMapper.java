package io.github.artsobol.fitnessapi.feature.article.article.mapper;

import io.github.artsobol.fitnessapi.config.persistence.MapStructConfig;
import io.github.artsobol.fitnessapi.feature.article.article.dto.response.CategoryResponse;
import io.github.artsobol.fitnessapi.feature.article.article.entity.Category;
import org.mapstruct.BeanMapping;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(config = MapStructConfig.class)
public interface CategoryMapper {

    @BeanMapping(ignoreByDefault = true)
    @Mapping(target = "id")
    @Mapping(target = "name")
    @Mapping(target = "slug")
    CategoryResponse toResponse(Category entity);
}
