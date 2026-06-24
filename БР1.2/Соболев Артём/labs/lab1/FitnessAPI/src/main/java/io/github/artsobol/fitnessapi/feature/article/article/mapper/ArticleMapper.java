package io.github.artsobol.fitnessapi.feature.article.article.mapper;

import io.github.artsobol.fitnessapi.config.persistence.MapStructConfig;
import io.github.artsobol.fitnessapi.feature.article.article.dto.response.ArticleResponse;
import io.github.artsobol.fitnessapi.feature.article.article.entity.Article;
import io.github.artsobol.fitnessapi.feature.user.mapper.UserMapper;
import io.github.artsobol.fitnessapi.feature.video.mapper.VideoMapper;
import org.mapstruct.BeanMapping;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(config = MapStructConfig.class, uses = {CategoryMapper.class, VideoMapper.class, UserMapper.class})
public interface ArticleMapper {

    @BeanMapping(ignoreByDefault = true)
    @Mapping(target = "id")
    @Mapping(target = "title")
    @Mapping(target = "description")
    @Mapping(target = "videos")
    @Mapping(target = "categories")
    @Mapping(target = "author")
    ArticleResponse toResponse(Article entity);
}
