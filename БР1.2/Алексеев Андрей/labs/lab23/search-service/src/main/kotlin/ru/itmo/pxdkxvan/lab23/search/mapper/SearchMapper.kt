package ru.itmo.pxdkxvan.lab23.search.mapper

import org.mapstruct.AfterMapping
import org.mapstruct.Mapper
import org.mapstruct.Mapping
import org.mapstruct.MappingConstants
import org.mapstruct.MappingTarget
import ru.itmo.pxdkxvan.lab23.search.dto.VacancySearchResponse
import ru.itmo.pxdkxvan.lab23.search.entity.VacancyDocument
import java.util.UUID

@Mapper(componentModel = MappingConstants.ComponentModel.SPRING)
interface SearchMapper {
    @Mapping(target = "vacancyId", expression = "java(java.util.UUID.fromString(entity.getVacancyId()))")
    @Mapping(target = "companyId", expression = "java(entity.getCompanyId() == null ? null : java.util.UUID.fromString(entity.getCompanyId()))")
    @Mapping(target = "skillCodes", expression = "java(java.util.List.of())")
    fun toVacancySearchResponse(entity: VacancyDocument): VacancySearchResponse

    @AfterMapping
    fun enrichVacancySearchResponse(entity: VacancyDocument, @MappingTarget response: VacancySearchResponse): VacancySearchResponse =
        response.copy(skillCodes = entity.skillsCsv.split(",").map(String::trim).filter(String::isNotBlank))
}
