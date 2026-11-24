package ru.itmo.pxdkxvan.lab1.dictionary.mapper

import org.mapstruct.Mapper
import org.mapstruct.Mapping
import org.mapstruct.MappingConstants
import ru.itmo.pxdkxvan.lab1.dictionary.dto.DictionaryResponse
import ru.itmo.pxdkxvan.lab1.dictionary.entity.ExperienceLevelEntity

@Mapper(componentModel = MappingConstants.ComponentModel.SPRING)
interface ExperienceLevelMapper {
    @Mapping(target = "isActive", source = "active")
    fun toResponse(entity: ExperienceLevelEntity): DictionaryResponse

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    @Mapping(target = "active", source = "isActive")
    fun fromRawData(
        code: String,
        displayName: String,
        description: String?,
        isActive: Boolean,
    ): ExperienceLevelEntity
}
