package ru.itmo.pxdkxvan.lab23.resume.mapper

import org.mapstruct.AfterMapping
import org.mapstruct.Mapper
import org.mapstruct.Mapping
import org.mapstruct.MappingConstants
import org.mapstruct.MappingTarget
import ru.itmo.pxdkxvan.lab23.resume.dto.ResumeResponse
import ru.itmo.pxdkxvan.lab23.resume.entity.ResumeEntity

@Mapper(componentModel = MappingConstants.ComponentModel.SPRING)
interface ResumeMapper {
    @Mapping(target = "skillCodes", expression = "java(java.util.List.of())")
    fun toResumeResponse(entity: ResumeEntity): ResumeResponse

    @AfterMapping
    fun enrichResumeResponse(entity: ResumeEntity, @MappingTarget response: ResumeResponse): ResumeResponse =
        response.copy(skillCodes = entity.skillsCsv.split(",").map(String::trim).filter(String::isNotBlank))
}
