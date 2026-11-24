package ru.itmo.pxdkxvan.lab1.dictionary.mapper

import org.mapstruct.Mapper
import org.mapstruct.Mapping
import org.mapstruct.MappingConstants
import ru.itmo.pxdkxvan.lab1.dictionary.dto.SkillResponse
import ru.itmo.pxdkxvan.lab1.dictionary.dto.SkillSummaryResponse
import ru.itmo.pxdkxvan.lab1.dictionary.entity.SkillEntity

@Mapper(componentModel = MappingConstants.ComponentModel.SPRING)
interface SkillMapper {
    fun toSkillSummaryResponse(entity: SkillEntity): SkillSummaryResponse

    @Mapping(target = "isActive", source = "active")
    fun toSkillResponse(entity: SkillEntity): SkillResponse

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    @Mapping(target = "active", source = "isActive")
    fun fromRawData(
        code: String,
        displayName: String,
        description: String?,
        isActive: Boolean,
    ): SkillEntity
}
