package ru.itmo.pxdkxvan.lab1.resume.mapper

import org.mapstruct.AfterMapping
import org.mapstruct.Mapper
import org.mapstruct.Mapping
import org.mapstruct.MappingConstants
import org.mapstruct.MappingTarget
import ru.itmo.pxdkxvan.lab1.dictionary.dto.SkillSummaryResponse
import ru.itmo.pxdkxvan.lab1.dictionary.entity.SkillEntity
import ru.itmo.pxdkxvan.lab1.dictionary.mapper.DictionaryMapper
import ru.itmo.pxdkxvan.lab1.resume.dto.ResumeEducationItemResponse
import ru.itmo.pxdkxvan.lab1.resume.dto.ResumeResponse
import ru.itmo.pxdkxvan.lab1.resume.dto.ResumeWorkExperienceItemResponse
import ru.itmo.pxdkxvan.lab1.resume.entity.ResumeEducationEntity
import ru.itmo.pxdkxvan.lab1.resume.entity.ResumeEntity
import ru.itmo.pxdkxvan.lab1.resume.entity.ResumeWorkExperienceEntity
import ru.itmo.pxdkxvan.lab1.user.entity.UserAccountEntity
import java.math.BigDecimal
import java.time.LocalDate

enum class EducationMarker {
    EDUCATION,
}

enum class WorkExperienceMarker {
    WORK_EXPERIENCE,
}

@Mapper(
    componentModel = MappingConstants.ComponentModel.SPRING,
    uses = [DictionaryMapper::class],
)
interface ResumeMapper {
    @Mapping(target = "userId", source = "user.id")
    @Mapping(target = "skills", expression = "java(java.util.List.of())")
    @Mapping(target = "educations", expression = "java(java.util.List.of())")
    @Mapping(target = "workExperiences", expression = "java(java.util.List.of())")
    fun toResumeResponse(entity: ResumeEntity): ResumeResponse

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    @Mapping(target = "user", source = "user")
    @Mapping(target = "skills", ignore = true)
    @Mapping(target = "educations", ignore = true)
    @Mapping(target = "workExperiences", ignore = true)
    fun fromRawData(
        user: UserAccountEntity,
        title: String,
        desiredPosition: String,
        aboutMe: String,
        salaryExpectation: BigDecimal?,
        city: String,
        employmentType: String,
        workFormat: String,
        status: String,
    ): ResumeEntity

    @Mapping(target = "isCurrent", source = "current")
    fun toResumeEducationItemResponse(entity: ResumeEducationEntity): ResumeEducationItemResponse

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "resume", source = "resume")
    @Mapping(target = "current", source = "isCurrent")
    fun fromRawData(
        resume: ResumeEntity,
        institutionName: String,
        degree: String,
        specialization: String?,
        startDate: LocalDate,
        endDate: LocalDate?,
        isCurrent: Boolean,
        description: String?,
        sortOrder: Int,
        educationMarker: EducationMarker,
    ): ResumeEducationEntity

    @Mapping(target = "isCurrent", source = "current")
    fun toResumeWorkExperienceItemResponse(entity: ResumeWorkExperienceEntity): ResumeWorkExperienceItemResponse

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "resume", source = "resume")
    @Mapping(target = "current", source = "isCurrent")
    fun fromRawData(
        resume: ResumeEntity,
        companyName: String,
        position: String,
        city: String?,
        startDate: LocalDate,
        endDate: LocalDate?,
        isCurrent: Boolean,
        description: String?,
        sortOrder: Int,
        workExperienceMarker: WorkExperienceMarker,
    ): ResumeWorkExperienceEntity

    fun toSkillSummaryResponse(entity: SkillEntity): SkillSummaryResponse

    @AfterMapping
    fun enrichResumeResponse(
        entity: ResumeEntity,
        @MappingTarget response: ResumeResponse,
    ): ResumeResponse =
        response.copy(
            skills = entity.skills.sortedBy { it.displayName }.map(this::toSkillSummaryResponse),
            educations = entity.educations.sortedBy { it.sortOrder }.map(this::toResumeEducationItemResponse),
            workExperiences = entity.workExperiences.sortedBy { it.sortOrder }.map(this::toResumeWorkExperienceItemResponse),
        )
}
