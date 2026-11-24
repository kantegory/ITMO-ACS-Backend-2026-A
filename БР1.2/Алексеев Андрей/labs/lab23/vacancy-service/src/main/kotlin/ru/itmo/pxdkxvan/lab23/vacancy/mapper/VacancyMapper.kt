package ru.itmo.pxdkxvan.lab23.vacancy.mapper

import org.mapstruct.AfterMapping
import org.mapstruct.Mapper
import org.mapstruct.Mapping
import org.mapstruct.MappingConstants
import org.mapstruct.MappingTarget
import ru.itmo.pxdkxvan.lab23.vacancy.dto.DictionaryResponse
import ru.itmo.pxdkxvan.lab23.vacancy.dto.VacancyAssignmentResponse
import ru.itmo.pxdkxvan.lab23.vacancy.dto.VacancyResponse
import ru.itmo.pxdkxvan.lab23.vacancy.entity.ExperienceLevelEntity
import ru.itmo.pxdkxvan.lab23.vacancy.entity.IndustryEntity
import ru.itmo.pxdkxvan.lab23.vacancy.entity.VacancyAssignmentEntity
import ru.itmo.pxdkxvan.lab23.vacancy.entity.VacancyEntity

@Mapper(componentModel = MappingConstants.ComponentModel.SPRING)
interface VacancyMapper {
    fun toIndustryResponse(entity: IndustryEntity): DictionaryResponse

    fun toExperienceLevelResponse(entity: ExperienceLevelEntity): DictionaryResponse

    fun toVacancyAssignmentResponse(entity: VacancyAssignmentEntity): VacancyAssignmentResponse

    @Mapping(target = "skillCodes", expression = "java(java.util.List.of())")
    fun toVacancyResponse(entity: VacancyEntity): VacancyResponse

    @AfterMapping
    fun enrichVacancyResponse(entity: VacancyEntity, @MappingTarget response: VacancyResponse): VacancyResponse =
        response.copy(skillCodes = entity.skillsCsv.split(",").map(String::trim).filter(String::isNotBlank))
}
