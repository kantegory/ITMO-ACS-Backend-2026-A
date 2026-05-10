package io.github.artsobol.userservice.feature.user.mapper;

import io.github.artsobol.common.config.persistence.MapStructConfig;
import io.github.artsobol.userservice.feature.user.dto.response.UserResponse;
import io.github.artsobol.userservice.feature.user.entity.User;
import org.mapstruct.BeanMapping;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(config = MapStructConfig.class)
public interface UserMapper {

    @BeanMapping(ignoreByDefault = true)
    @Mapping(target = "id")
    @Mapping(target = "username")
    @Mapping(target = "role")
    UserResponse toResponse(User user);
}
