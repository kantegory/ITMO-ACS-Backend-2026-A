package io.github.artsobol.mediaservice.feature.video.mapper;

import io.github.artsobol.common.config.persistence.MapStructConfig;
import io.github.artsobol.mediaservice.feature.video.dto.response.VideoResponse;
import io.github.artsobol.mediaservice.feature.video.entity.Video;
import org.mapstruct.BeanMapping;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(config = MapStructConfig.class)
public interface VideoMapper {

    @BeanMapping(ignoreByDefault = true)
    @Mapping(target = "id")
    @Mapping(target = "title")
    @Mapping(target = "url")
    VideoResponse toResponse(Video entity);
}
