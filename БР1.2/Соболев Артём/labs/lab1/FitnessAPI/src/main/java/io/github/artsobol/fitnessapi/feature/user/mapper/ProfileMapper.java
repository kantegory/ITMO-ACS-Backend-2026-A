package io.github.artsobol.fitnessapi.feature.user.mapper;

import io.github.artsobol.fitnessapi.config.persistence.MapStructConfig;
import io.github.artsobol.fitnessapi.feature.user.dto.response.ProfileResponse;
import io.github.artsobol.fitnessapi.feature.user.entity.Profile;
import org.mapstruct.BeanMapping;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(config = MapStructConfig.class, uses = UserMapper.class)
public interface ProfileMapper {

    @BeanMapping(ignoreByDefault = true)
    @Mapping(target = "id")
    @Mapping(target = "firstName")
    @Mapping(target = "lastName")
    @Mapping(target = "user")
    ProfileResponse toResponse(Profile profile);
}
