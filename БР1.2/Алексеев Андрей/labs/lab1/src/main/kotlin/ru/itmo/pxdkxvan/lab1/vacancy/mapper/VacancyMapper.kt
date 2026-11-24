package ru.itmo.pxdkxvan.lab1.vacancy.mapper

import org.mapstruct.AfterMapping
import org.mapstruct.Mapper
import org.mapstruct.Mapping
import org.mapstruct.MappingConstants
import org.mapstruct.MappingTarget
import ru.itmo.pxdkxvan.lab1.dictionary.dto.SkillSummaryResponse
import ru.itmo.pxdkxvan.lab1.company.entity.CompanyEntity
import ru.itmo.pxdkxvan.lab1.company.entity.EmployerProfileEntity
import ru.itmo.pxdkxvan.lab1.dictionary.entity.ExperienceLevelEntity
import ru.itmo.pxdkxvan.lab1.dictionary.entity.IndustryEntity
import ru.itmo.pxdkxvan.lab1.dictionary.entity.SkillEntity
import ru.itmo.pxdkxvan.lab1.dictionary.mapper.DictionaryMapper
import ru.itmo.pxdkxvan.lab1.vacancy.dto.OrderedTextItemResponse
import ru.itmo.pxdkxvan.lab1.vacancy.dto.VacancyAssignmentResponse
import ru.itmo.pxdkxvan.lab1.vacancy.dto.VacancyResponse
import ru.itmo.pxdkxvan.lab1.vacancy.entity.VacancyAssignmentEntity
import ru.itmo.pxdkxvan.lab1.vacancy.entity.VacancyBenefitEntity
import ru.itmo.pxdkxvan.lab1.vacancy.entity.VacancyEntity
import ru.itmo.pxdkxvan.lab1.vacancy.entity.VacancyRequirementEntity
import ru.itmo.pxdkxvan.lab1.vacancy.entity.VacancyResponsibilityEntity
import java.math.BigDecimal

@Mapper(
    componentModel = MappingConstants.ComponentModel.SPRING,
    uses = [DictionaryMapper::class],
)
interface VacancyMapper {
    fun toRequirementResponse(entity: VacancyRequirementEntity): OrderedTextItemResponse

    fun toResponsibilityResponse(entity: VacancyResponsibilityEntity): OrderedTextItemResponse

    fun toBenefitResponse(entity: VacancyBenefitEntity): OrderedTextItemResponse

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    @Mapping(target = "company", source = "company")
    @Mapping(target = "industry", source = "industry")
    @Mapping(target = "experienceLevel", source = "experienceLevel")
    @Mapping(target = "title", source = "title")
    @Mapping(target = "description", source = "description")
    @Mapping(target = "salaryFrom", source = "salaryFrom")
    @Mapping(target = "salaryTo", source = "salaryTo")
    @Mapping(target = "city", source = "city")
    @Mapping(target = "employmentType", source = "employmentType")
    @Mapping(target = "workFormat", source = "workFormat")
    @Mapping(target = "status", source = "status")
    @Mapping(target = "primaryAssignment", ignore = true)
    @Mapping(target = "skills", ignore = true)
    @Mapping(target = "requirements", ignore = true)
    @Mapping(target = "responsibilities", ignore = true)
    @Mapping(target = "benefits", ignore = true)
    @Mapping(target = "assignments", ignore = true)
    fun fromRawData(
        company: CompanyEntity,
        industry: IndustryEntity,
        experienceLevel: ExperienceLevelEntity,
        title: String,
        description: String,
        salaryFrom: BigDecimal?,
        salaryTo: BigDecimal?,
        city: String,
        employmentType: String,
        workFormat: String,
        status: String,
    ): VacancyEntity

    @Mapping(target = "employerProfileId", source = "employerProfile.id")
    @Mapping(target = "vacancyId", source = "vacancy.id")
    fun toVacancyAssignmentResponse(entity: VacancyAssignmentEntity): VacancyAssignmentResponse

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    @Mapping(target = "version", ignore = true)
    @Mapping(target = "vacancy", source = "vacancy")
    @Mapping(target = "employerProfile", source = "employerProfile")
    fun fromRawData(
        vacancy: VacancyEntity,
        employerProfile: EmployerProfileEntity,
        assignmentRole: String,
    ): VacancyAssignmentEntity

    @Mapping(target = "vacancyAssignmentId", source = "primaryAssignment.id")
    @Mapping(target = "companyId", source = "company.id")
    @Mapping(target = "industryId", source = "industry.id")
    @Mapping(target = "experienceLevelId", source = "experienceLevel.id")
    @Mapping(target = "skills", expression = "java(java.util.List.of())")
    @Mapping(target = "requirements", expression = "java(java.util.List.of())")
    @Mapping(target = "responsibilities", expression = "java(java.util.List.of())")
    @Mapping(target = "benefits", expression = "java(java.util.List.of())")
    fun toVacancyResponse(entity: VacancyEntity): VacancyResponse

    fun toSkillSummaryResponse(entity: SkillEntity): SkillSummaryResponse

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "vacancy", source = "vacancy")
    fun fromRawData(
        vacancy: VacancyEntity,
        value: String,
        sortOrder: Int,
    ): VacancyRequirementEntity

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "vacancy", source = "vacancy")
    fun fromRawData(
        vacancy: VacancyEntity,
        value: String,
        sortOrder: Int,
        responsibilityMarker: Unit = Unit,
    ): VacancyResponsibilityEntity

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "vacancy", source = "vacancy")
    fun fromRawData(
        vacancy: VacancyEntity,
        value: String,
        sortOrder: Int,
        benefitMarker: String = "benefit",
    ): VacancyBenefitEntity

    @AfterMapping
    fun enrichVacancyResponse(
        entity: VacancyEntity,
        @MappingTarget response: VacancyResponse,
    ): VacancyResponse =
        response.copy(
            skills = entity.skills.sortedBy { it.displayName }.map(this::toSkillSummaryResponse),
            requirements = entity.requirements.sortedBy { it.sortOrder }.map(this::toRequirementResponse),
            responsibilities = entity.responsibilities.sortedBy { it.sortOrder }.map(this::toResponsibilityResponse),
            benefits = entity.benefits.sortedBy { it.sortOrder }.map(this::toBenefitResponse),
        )
}
