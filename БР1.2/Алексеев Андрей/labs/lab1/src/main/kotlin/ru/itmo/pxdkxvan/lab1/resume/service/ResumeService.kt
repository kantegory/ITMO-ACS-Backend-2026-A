package ru.itmo.pxdkxvan.lab1.resume.service

import org.springframework.data.domain.Sort
import org.springframework.http.HttpStatus
import org.springframework.security.oauth2.jwt.Jwt
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import ru.itmo.pxdkxvan.lab1.common.ApiErrorCode
import ru.itmo.pxdkxvan.lab1.common.ApiException
import ru.itmo.pxdkxvan.lab1.common.EmploymentType
import ru.itmo.pxdkxvan.lab1.common.ErrorDetail
import ru.itmo.pxdkxvan.lab1.common.PageResponse
import ru.itmo.pxdkxvan.lab1.common.PublicationStatus
import ru.itmo.pxdkxvan.lab1.common.SystemRole
import ru.itmo.pxdkxvan.lab1.common.WorkFormat
import ru.itmo.pxdkxvan.lab1.common.buildPageable
import ru.itmo.pxdkxvan.lab1.common.parseEnumValue
import ru.itmo.pxdkxvan.lab1.common.requireCondition
import ru.itmo.pxdkxvan.lab1.common.requireNonNegative
import ru.itmo.pxdkxvan.lab1.common.toPageResponse
import ru.itmo.pxdkxvan.lab1.resume.entity.ResumeEntity
import ru.itmo.pxdkxvan.lab1.resume.dto.ResumeCreateRequest
import ru.itmo.pxdkxvan.lab1.resume.dto.ResumeEducationItemRequest
import ru.itmo.pxdkxvan.lab1.resume.dto.ResumeResponse
import ru.itmo.pxdkxvan.lab1.resume.dto.ResumeUpdateRequest
import ru.itmo.pxdkxvan.lab1.resume.dto.ResumeWorkExperienceItemRequest
import ru.itmo.pxdkxvan.lab1.resume.mapper.EducationMarker
import ru.itmo.pxdkxvan.lab1.resume.mapper.ResumeMapper
import ru.itmo.pxdkxvan.lab1.resume.mapper.WorkExperienceMarker
import ru.itmo.pxdkxvan.lab1.resume.repository.ResumeRepository
import ru.itmo.pxdkxvan.lab1.dictionary.repository.SkillRepository
import ru.itmo.pxdkxvan.lab1.user.service.CurrentUserService
import java.math.BigDecimal
import java.time.LocalDate
import java.util.UUID

@Service
class ResumeService(
    private val currentUserService: CurrentUserService,
    private val resumeRepository: ResumeRepository,
    private val skillRepository: SkillRepository,
    private val resumeMapper: ResumeMapper,
) {
    @Transactional(readOnly = true)
    fun list(jwt: Jwt, page: Int, limit: Int, sort: Map<String, String>): PageResponse<ResumeResponse> {
        val user = currentUserService.currentUserWithRole(jwt, SystemRole.APPLICANT)
        val pageable = buildPageable(
            page = page,
            limit = limit,
            sortRules = sort,
            supportedSorts = mapOf(
                "created_at" to "createdAt",
                "updated_at" to "updatedAt",
                "title" to "title",
                "salary_expectation" to "salaryExpectation",
            ),
            defaultSorts = listOf("createdAt" to Sort.Direction.DESC),
        )
        return resumeRepository.findAllByUser(user, pageable).toPageResponse(page, limit, resumeMapper::toResumeResponse)
    }

    @Transactional
    fun create(jwt: Jwt, request: ResumeCreateRequest): ResumeResponse {
        val user = currentUserService.currentUserWithRole(jwt, SystemRole.APPLICANT)
        validateResumePayload(request.salaryExpectation, request.employmentType, request.workFormat, request.status)

        val resume = resumeMapper.fromRawData(
            user = user,
            title = request.title.trim(),
            desiredPosition = request.desiredPosition.trim(),
            aboutMe = request.aboutMe.trim(),
            salaryExpectation = request.salaryExpectation,
            city = request.city.trim(),
            employmentType = parseEnumValue<EmploymentType>("employment_type", request.employmentType).name,
            workFormat = parseEnumValue<WorkFormat>("work_format", request.workFormat).name,
            status = parseEnumValue<PublicationStatus>("status", request.status).name,
        )

        syncResumeSkills(resume, request.skillIds)
        syncResumeEducations(resume, request.educations)
        syncResumeWorkExperiences(resume, request.workExperiences)

        val saved = resumeRepository.saveAndFlush(resume)
        return resumeMapper.toResumeResponse(
            resumeRepository.findById(saved.id!!).orElseThrow {
                ApiException(HttpStatus.INTERNAL_SERVER_ERROR, ApiErrorCode.INTERNAL, "Resume was not found after creation")
            },
        )
    }

    @Transactional(readOnly = true)
    fun get(jwt: Jwt, resumeId: UUID): ResumeResponse = resumeMapper.toResumeResponse(ownedResume(jwt, resumeId))

    @Transactional
    fun update(jwt: Jwt, resumeId: UUID, request: ResumeUpdateRequest): ResumeResponse {
        val resume = ownedResume(jwt, resumeId)
        request.salaryExpectation?.let { requireNonNegative(it, "salary_expectation") }

        request.title?.let {
            requireCondition(it.isNotBlank(), "title must not be blank", "title")
            resume.title = it.trim()
        }
        request.desiredPosition?.let {
            requireCondition(it.isNotBlank(), "desired_position must not be blank", "desired_position")
            resume.desiredPosition = it.trim()
        }
        request.aboutMe?.let {
            requireCondition(it.isNotBlank(), "about_me must not be blank", "about_me")
            resume.aboutMe = it.trim()
        }
        request.salaryExpectation?.let { resume.salaryExpectation = it }
        request.city?.let {
            requireCondition(it.isNotBlank(), "city must not be blank", "city")
            resume.city = it.trim()
        }
        request.employmentType?.let { resume.employmentType = parseEnumValue<EmploymentType>("employment_type", it).name }
        request.workFormat?.let { resume.workFormat = parseEnumValue<WorkFormat>("work_format", it).name }
        request.status?.let { resume.status = parseEnumValue<PublicationStatus>("status", it).name }
        request.skillIds?.let { syncResumeSkills(resume, it) }
        request.educations?.let { syncResumeEducations(resume, it) }
        request.workExperiences?.let { syncResumeWorkExperiences(resume, it) }

        return resumeMapper.toResumeResponse(resumeRepository.save(resume))
    }

    @Transactional
    fun delete(jwt: Jwt, resumeId: UUID) {
        resumeRepository.delete(ownedResume(jwt, resumeId))
    }

    private fun ownedResume(jwt: Jwt, resumeId: UUID): ResumeEntity {
        val user = currentUserService.currentUserWithRole(jwt, SystemRole.APPLICANT)
        val resume = resumeRepository.findById(resumeId).orElseThrow {
            ApiException(HttpStatus.NOT_FOUND, ApiErrorCode.NOT_FOUND, "Resume not found")
        }
        if (resume.user.id != user.id) {
            throw ApiException(HttpStatus.FORBIDDEN, ApiErrorCode.FORBIDDEN, "You can access only your resumes")
        }
        return resume
    }

    private fun validateResumePayload(
        salaryExpectation: BigDecimal?,
        employmentType: String,
        workFormat: String,
        status: String,
    ) {
        requireNonNegative(salaryExpectation, "salary_expectation")
        parseEnumValue<EmploymentType>("employment_type", employmentType)
        parseEnumValue<WorkFormat>("work_format", workFormat)
        parseEnumValue<PublicationStatus>("status", status)
    }

    private fun syncResumeSkills(resume: ResumeEntity, skillIds: List<UUID>) {
        val distinctIds = skillIds.distinct()
        val skills = skillRepository.findAllById(distinctIds)
        requireCondition(skills.size == distinctIds.size, "One or more skills were not found", "skill_ids")
        resume.skills.clear()
        resume.skills.addAll(skills)
    }

    private fun syncResumeEducations(resume: ResumeEntity, items: List<ResumeEducationItemRequest>) {
        resume.educations.clear()
        items.forEachIndexed { index, item ->
            validateDateRange(item.startDate, item.endDate, item.isCurrent, "educations[$index]")
            resume.educations += resumeMapper.fromRawData(
                resume = resume,
                institutionName = item.institutionName.trim(),
                degree = item.degree.trim(),
                specialization = item.specialization?.trim()?.ifBlank { null },
                startDate = item.startDate,
                endDate = item.endDate,
                isCurrent = item.isCurrent,
                description = item.description?.trim()?.ifBlank { null },
                sortOrder = index + 1,
                educationMarker = EducationMarker.EDUCATION,
            )
        }
    }

    private fun syncResumeWorkExperiences(resume: ResumeEntity, items: List<ResumeWorkExperienceItemRequest>) {
        resume.workExperiences.clear()
        items.forEachIndexed { index, item ->
            validateDateRange(item.startDate, item.endDate, item.isCurrent, "work_experiences[$index]")
            resume.workExperiences += resumeMapper.fromRawData(
                resume = resume,
                companyName = item.companyName.trim(),
                position = item.position.trim(),
                city = item.city?.trim()?.ifBlank { null },
                startDate = item.startDate,
                endDate = item.endDate,
                isCurrent = item.isCurrent,
                description = item.description?.trim()?.ifBlank { null },
                sortOrder = index + 1,
                workExperienceMarker = WorkExperienceMarker.WORK_EXPERIENCE,
            )
        }
    }

    private fun validateDateRange(startDate: LocalDate, endDate: LocalDate?, isCurrent: Boolean, field: String) {
        if (endDate != null) {
            requireCondition(!endDate.isBefore(startDate), "$field end_date must not be before start_date", field)
        }
        if (isCurrent && endDate != null) {
            throw ApiException(
                HttpStatus.BAD_REQUEST,
                ApiErrorCode.VALIDATION,
                "$field must not contain end_date when is_current is true",
                listOf(ErrorDetail(field, "end_date must be null when is_current is true")),
            )
        }
    }
}
