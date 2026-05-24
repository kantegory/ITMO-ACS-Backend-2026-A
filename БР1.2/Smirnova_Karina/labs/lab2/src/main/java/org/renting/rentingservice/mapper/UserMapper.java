package org.renting.rentingservice.mapper;

import org.mapstruct.Mapper;
import org.renting.rentingservice.domain.entity.UserEntity;
import org.renting.rentingservice.dto.auth.RegisterResponse;
import org.renting.rentingservice.dto.user.UserMeResponse;

@Mapper(componentModel = "spring")
public interface UserMapper {

    UserMeResponse toMeResponse(UserEntity user);

    RegisterResponse toRegisterResponse(UserEntity user);
}
