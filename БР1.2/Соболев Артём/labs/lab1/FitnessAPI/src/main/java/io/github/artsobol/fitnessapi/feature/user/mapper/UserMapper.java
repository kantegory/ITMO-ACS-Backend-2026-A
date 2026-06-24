package io.github.artsobol.fitnessapi.feature.user.mapper;

import io.github.artsobol.fitnessapi.config.persistence.MapStructConfig;
import io.github.artsobol.fitnessapi.feature.user.dto.response.UserResponse;
import io.github.artsobol.fitnessapi.feature.user.entity.User;
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
