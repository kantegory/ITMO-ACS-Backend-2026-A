package io.github.artsobol.blogservice.feature.article.comment.mapper;

import io.github.artsobol.common.config.persistence.MapStructConfig;
import io.github.artsobol.blogservice.feature.article.comment.dto.response.CommentResponse;
import io.github.artsobol.blogservice.feature.article.comment.entity.Comment;
import org.mapstruct.BeanMapping;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(config = MapStructConfig.class)
public interface CommentMapper {

    @BeanMapping(ignoreByDefault = true)
    @Mapping(target = "id")
    @Mapping(target = "comment")
    @Mapping(target = "userId")
    @Mapping(target = "createdAt")
    @Mapping(target = "updatedAt")
    CommentResponse toResponse(Comment entity);
}
