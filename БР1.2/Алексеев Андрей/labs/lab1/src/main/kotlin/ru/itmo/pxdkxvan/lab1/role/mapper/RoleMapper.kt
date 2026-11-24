package ru.itmo.pxdkxvan.lab1.role.mapper

import org.mapstruct.Mapper
import org.mapstruct.Mapping
import org.mapstruct.MappingConstants
import ru.itmo.pxdkxvan.lab1.role.dto.RoleResponse
import ru.itmo.pxdkxvan.lab1.role.entity.RoleEntity

@Mapper(componentModel = MappingConstants.ComponentModel.SPRING)
interface RoleMapper {
    @Mapping(target = "isSystem", source = "system")
    fun toRoleResponse(entity: RoleEntity): RoleResponse

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    @Mapping(target = "system", source = "isSystem")
    fun fromRawData(
        name: String,
        description: String?,
        isSystem: Boolean,
    ): RoleEntity
}
