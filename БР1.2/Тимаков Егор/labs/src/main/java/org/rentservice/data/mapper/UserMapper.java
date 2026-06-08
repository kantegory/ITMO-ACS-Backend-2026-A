package org.rentservice.data.mapper;

import org.mapstruct.Mapper;
import org.rentservice.data.entity.User;
import org.rentservice.data.response.UserResponse;
import org.rentservice.data.response.UserShortDto;

@Mapper(componentModel = "spring")
public interface UserMapper {

    UserResponse toResponse(User user);


    UserShortDto toShortDto(User user);
}
