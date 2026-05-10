package io.github.artsobol.blogservice.feature.article.article.mapper;

import io.github.artsobol.common.config.persistence.MapStructConfig;
import io.github.artsobol.blogservice.feature.article.article.dto.response.ArticleResponse;
import io.github.artsobol.blogservice.feature.article.article.entity.Article;
import org.mapstruct.BeanMapping;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(config = MapStructConfig.class, uses = {CategoryMapper.class})
public interface ArticleMapper {

    @BeanMapping(ignoreByDefault = true)
    @Mapping(target = "id")
    @Mapping(target = "title")
    @Mapping(target = "description")
    @Mapping(target = "videoIds")
    @Mapping(target = "categories")
    @Mapping(target = "authorId")
    ArticleResponse toResponse(Article entity);
}
