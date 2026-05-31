package ru.itmo.pxdkxvan.lab23.user.mapper

import org.mapstruct.AfterMapping
import org.mapstruct.Mapper
import org.mapstruct.Mapping
import org.mapstruct.MappingConstants
import org.mapstruct.MappingTarget
import ru.itmo.pxdkxvan.lab23.user.dto.AuthContextResponse
import ru.itmo.pxdkxvan.lab23.user.dto.NotificationContextResponse
import ru.itmo.pxdkxvan.lab23.user.dto.RoleResponse
import ru.itmo.pxdkxvan.lab23.user.dto.UserResponse
import ru.itmo.pxdkxvan.lab23.user.entity.RoleEntity
import ru.itmo.pxdkxvan.lab23.user.entity.UserEntity

@Mapper(componentModel = MappingConstants.ComponentModel.SPRING)
interface UserMapper {
    @Mapping(target = "roles", expression = "java(java.util.List.of())")
    fun toUserResponse(entity: UserEntity): UserResponse

    @Mapping(target = "userId", source = "id")
    @Mapping(target = "roles", expression = "java(java.util.List.of())")
    fun toAuthContextResponse(entity: UserEntity): AuthContextResponse

    @Mapping(target = "userId", source = "id")
    fun toNotificationContextResponse(entity: UserEntity): NotificationContextResponse

    fun toRoleResponse(entity: RoleEntity): RoleResponse

    @AfterMapping
    fun enrichUserResponse(entity: UserEntity, @MappingTarget response: UserResponse): UserResponse =
        response.copy(roles = entity.roles.sortedBy { it.name }.map { it.name })

    @AfterMapping
    fun enrichAuthContextResponse(entity: UserEntity, @MappingTarget response: AuthContextResponse): AuthContextResponse =
        response.copy(roles = entity.roles.sortedBy { it.name }.map { it.name })
}
