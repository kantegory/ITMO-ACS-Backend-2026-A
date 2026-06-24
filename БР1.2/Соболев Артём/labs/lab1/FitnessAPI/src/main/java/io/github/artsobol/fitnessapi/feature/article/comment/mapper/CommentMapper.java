package io.github.artsobol.fitnessapi.feature.article.comment.mapper;

import io.github.artsobol.fitnessapi.config.persistence.MapStructConfig;
import io.github.artsobol.fitnessapi.feature.article.comment.dto.response.CommentResponse;
import io.github.artsobol.fitnessapi.feature.article.comment.entity.Comment;
import io.github.artsobol.fitnessapi.feature.user.mapper.UserMapper;
import org.mapstruct.BeanMapping;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(config = MapStructConfig.class, uses = {UserMapper.class})
public interface CommentMapper {

    @BeanMapping(ignoreByDefault = true)
    @Mapping(target = "id")
    @Mapping(target = "comment")
    @Mapping(target = "user")
    @Mapping(target = "createdAt")
    @Mapping(target = "updatedAt")
    CommentResponse toResponse(Comment entity);
}
