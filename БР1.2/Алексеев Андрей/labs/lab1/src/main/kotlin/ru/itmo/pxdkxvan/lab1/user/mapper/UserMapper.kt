package ru.itmo.pxdkxvan.lab1.user.mapper

import org.mapstruct.AfterMapping
import org.mapstruct.Mapper
import org.mapstruct.Mapping
import org.mapstruct.MappingConstants
import org.mapstruct.MappingTarget
import ru.itmo.pxdkxvan.lab1.role.dto.RoleResponse
import ru.itmo.pxdkxvan.lab1.role.entity.RoleEntity
import ru.itmo.pxdkxvan.lab1.role.mapper.RoleMapper
import ru.itmo.pxdkxvan.lab1.user.dto.UserResponse
import ru.itmo.pxdkxvan.lab1.user.entity.UserAccountEntity

@Mapper(
    componentModel = MappingConstants.ComponentModel.SPRING,
    uses = [RoleMapper::class],
)
interface UserMapper {
    @Mapping(target = "isVerified", source = "verified")
    @Mapping(target = "roles", expression = "java(java.util.List.of())")
    fun toUserResponse(entity: UserAccountEntity): UserResponse

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    @Mapping(target = "verified", ignore = true)
    fun fromRawData(
        firstName: String,
        lastName: String,
        middleName: String?,
        email: String,
        phone: String,
        passwordHash: String,
        roles: Collection<RoleEntity>,
    ): UserAccountEntity

    @Mapping(target = "isSystem", source = "system")
    fun toRoleResponse(entity: RoleEntity): RoleResponse

    @AfterMapping
    fun enrichUserResponse(entity: UserAccountEntity, @MappingTarget response: UserResponse): UserResponse =
        response.copy(
            roles = entity.roles.sortedBy { it.name }.map(this::toRoleResponse),
        )
}
