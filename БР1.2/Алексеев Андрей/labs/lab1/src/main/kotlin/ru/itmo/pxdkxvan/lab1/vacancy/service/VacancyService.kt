package ru.itmo.pxdkxvan.lab1.vacancy.service

import jakarta.persistence.criteria.CriteriaBuilder
import jakarta.persistence.criteria.Expression
import jakarta.persistence.criteria.JoinType
import jakarta.persistence.criteria.Predicate
import org.springframework.data.domain.Sort
import org.springframework.data.jpa.domain.Specification
import org.springframework.http.HttpStatus
import org.springframework.security.oauth2.jwt.Jwt
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import ru.itmo.pxdkxvan.lab1.common.ApiErrorCode
import ru.itmo.pxdkxvan.lab1.common.ApiException
import ru.itmo.pxdkxvan.lab1.common.AssignmentRole
import ru.itmo.pxdkxvan.lab1.common.EmploymentType
import ru.itmo.pxdkxvan.lab1.common.PageResponse
import ru.itmo.pxdkxvan.lab1.common.PublicationStatus
import ru.itmo.pxdkxvan.lab1.common.WorkFormat
import ru.itmo.pxdkxvan.lab1.common.buildPageable
import ru.itmo.pxdkxvan.lab1.common.normalizeCode
import ru.itmo.pxdkxvan.lab1.common.parseEnumValue
import ru.itmo.pxdkxvan.lab1.common.requireCondition
import ru.itmo.pxdkxvan.lab1.common.toPageResponse
import ru.itmo.pxdkxvan.lab1.common.validateSalaryRange
import ru.itmo.pxdkxvan.lab1.company.entity.CompanyEntity
import ru.itmo.pxdkxvan.lab1.company.entity.EmployerProfileEntity
import ru.itmo.pxdkxvan.lab1.company.service.CompanyService
import ru.itmo.pxdkxvan.lab1.dictionary.entity.ExperienceLevelEntity
import ru.itmo.pxdkxvan.lab1.dictionary.entity.IndustryEntity
import ru.itmo.pxdkxvan.lab1.dictionary.entity.SkillEntity
import ru.itmo.pxdkxvan.lab1.dictionary.service.DictionaryService
import ru.itmo.pxdkxvan.lab1.vacancy.entity.VacancyAssignmentEntity
import ru.itmo.pxdkxvan.lab1.vacancy.entity.VacancyBenefitEntity
import ru.itmo.pxdkxvan.lab1.vacancy.entity.VacancyEntity
import ru.itmo.pxdkxvan.lab1.vacancy.entity.VacancyRequirementEntity
import ru.itmo.pxdkxvan.lab1.vacancy.entity.VacancyResponsibilityEntity
import ru.itmo.pxdkxvan.lab1.vacancy.dto.OrderedTextItemRequest
import ru.itmo.pxdkxvan.lab1.vacancy.dto.VacancyCreateRequest
import ru.itmo.pxdkxvan.lab1.vacancy.dto.VacancyResponse
import ru.itmo.pxdkxvan.lab1.vacancy.dto.VacancyUpdateRequest
import ru.itmo.pxdkxvan.lab1.dictionary.repository.SkillRepository
import ru.itmo.pxdkxvan.lab1.vacancy.mapper.VacancyMapper
import ru.itmo.pxdkxvan.lab1.vacancy.repository.VacancyAssignmentRepository
import ru.itmo.pxdkxvan.lab1.vacancy.repository.VacancyRepository
import java.math.BigDecimal
import java.util.UUID

@Service
class VacancyService(
    private val vacancyRepository: VacancyRepository,
    private val vacancyAssignmentRepository: VacancyAssignmentRepository,
    private val skillRepository: SkillRepository,
    private val companyService: CompanyService,
    private val dictionaryService: DictionaryService,
    private val vacancyMapper: VacancyMapper,
) {
    private val supportedSearchKeys = setOf(
        "title",
        "description",
        "company",
        "city",
        "industries",
        "experience_levels",
        "skills",
        "employment_types",
        "work_formats",
        "statuses",
        "requirement_text",
        "responsibility_text",
        "benefit_text",
    )

    @Transactional(readOnly = true)
    fun listPublic(
        page: Int,
        limit: Int,
        sort: Map<String, String>,
        search: Map<String, List<String>>,
        salaryFrom: BigDecimal?,
        salaryTo: BigDecimal?,
    ): PageResponse<VacancyResponse> = listVacancies(page, limit, sort, search, salaryFrom, salaryTo, true, null)

    @Transactional(readOnly = true)
    fun my(
        jwt: Jwt,
        page: Int,
        limit: Int,
        sort: Map<String, String>,
        search: Map<String, List<String>>,
        salaryFrom: BigDecimal?,
        salaryTo: BigDecimal?,
    ): PageResponse<VacancyResponse> {
        val profile = companyService.currentEmployerProfileEntity(jwt)
        return listVacancies(page, limit, sort, search, salaryFrom, salaryTo, false, profile.id)
    }

    @Transactional
    fun create(jwt: Jwt, request: VacancyCreateRequest): VacancyResponse {
        val profile = companyService.currentEmployerProfileEntity(jwt)
        requireCondition(profile.company.id == request.companyId, "company_id must match current employer company", "company_id")
        validateVacancyPayload(request.salaryFrom, request.salaryTo, request.employmentType, request.workFormat, request.status)

        val vacancy = vacancyMapper.fromRawData(
            company = profile.company,
            industry = dictionaryService.findIndustry(request.industryId),
            experienceLevel = dictionaryService.findExperienceLevel(request.experienceLevelId),
            title = request.title.trim(),
            description = request.description.trim(),
            salaryFrom = request.salaryFrom,
            salaryTo = request.salaryTo,
            city = request.city.trim(),
            employmentType = parseEnumValue<EmploymentType>("employment_type", request.employmentType).name,
            workFormat = parseEnumValue<WorkFormat>("work_format", request.workFormat).name,
            status = parseEnumValue<PublicationStatus>("status", request.status).name,
        )

        syncVacancySkills(vacancy, request.skillIds)
        syncVacancyRequirements(vacancy, request.requirements)
        syncVacancyResponsibilities(vacancy, request.responsibilities)
        syncVacancyBenefits(vacancy, request.benefits)

        val savedVacancy = vacancyRepository.saveAndFlush(vacancy)
        val assignment = vacancyAssignmentRepository.saveAndFlush(
            vacancyMapper.fromRawData(
                vacancy = savedVacancy,
                employerProfile = profile,
                assignmentRole = AssignmentRole.PRIMARY.name,
            ),
        )
        savedVacancy.primaryAssignment = assignment
        vacancyRepository.saveAndFlush(savedVacancy)
        return vacancyMapper.toVacancyResponse(
            vacancyRepository.findById(savedVacancy.id!!).orElseThrow {
                ApiException(HttpStatus.INTERNAL_SERVER_ERROR, ApiErrorCode.INTERNAL, "Vacancy was not found after creation")
            },
        )
    }

    @Transactional(readOnly = true)
    fun getPublic(jwt: Jwt?, vacancyId: UUID): VacancyResponse {
        val vacancy = vacancyRepository.findById(vacancyId).orElseThrow {
            ApiException(HttpStatus.NOT_FOUND, ApiErrorCode.NOT_FOUND, "Vacancy not found")
        }
        if (vacancy.status == PublicationStatus.PUBLISHED.name) {
            return vacancyMapper.toVacancyResponse(vacancy)
        }

        if (jwt == null) {
            throw ApiException(HttpStatus.NOT_FOUND, ApiErrorCode.NOT_FOUND, "Vacancy not found")
        }
        val profile = runCatching { companyService.currentEmployerProfileEntity(jwt) }.getOrNull()
        if (profile == null || !isEmployerAssigned(vacancy, profile.id!!)) {
            throw ApiException(HttpStatus.NOT_FOUND, ApiErrorCode.NOT_FOUND, "Vacancy not found")
        }

        return vacancyMapper.toVacancyResponse(vacancy)
    }

    @Transactional
    fun update(jwt: Jwt, vacancyId: UUID, request: VacancyUpdateRequest): VacancyResponse {
        val vacancy = managedVacancy(jwt, vacancyId)
        val profile = companyService.currentEmployerProfileEntity(jwt)

        request.companyId?.let {
            requireCondition(it == profile.company.id, "company_id must match current employer company", "company_id")
            vacancy.company = profile.company
        }
        request.industryId?.let { vacancy.industry = dictionaryService.findIndustry(it) }
        request.experienceLevelId?.let { vacancy.experienceLevel = dictionaryService.findExperienceLevel(it) }
        request.title?.let {
            requireCondition(it.isNotBlank(), "title must not be blank", "title")
            vacancy.title = it.trim()
        }
        request.description?.let {
            requireCondition(it.isNotBlank(), "description must not be blank", "description")
            vacancy.description = it.trim()
        }
        request.salaryFrom?.let { vacancy.salaryFrom = it }
        request.salaryTo?.let { vacancy.salaryTo = it }
        validateSalaryRange(vacancy.salaryFrom, vacancy.salaryTo)
        request.city?.let {
            requireCondition(it.isNotBlank(), "city must not be blank", "city")
            vacancy.city = it.trim()
        }
        request.employmentType?.let { vacancy.employmentType = parseEnumValue<EmploymentType>("employment_type", it).name }
        request.workFormat?.let { vacancy.workFormat = parseEnumValue<WorkFormat>("work_format", it).name }
        request.status?.let { vacancy.status = parseEnumValue<PublicationStatus>("status", it).name }
        request.vacancyAssignmentId?.let { vacancy.primaryAssignment = findAssignmentForVacancy(vacancy, it) }
        request.skillIds?.let { syncVacancySkills(vacancy, it) }
        request.requirements?.let { syncVacancyRequirements(vacancy, it) }
        request.responsibilities?.let { syncVacancyResponsibilities(vacancy, it) }
        request.benefits?.let { syncVacancyBenefits(vacancy, it) }

        return vacancyMapper.toVacancyResponse(vacancyRepository.save(vacancy))
    }

    @Transactional
    fun delete(jwt: Jwt, vacancyId: UUID) {
        vacancyRepository.delete(managedVacancy(jwt, vacancyId))
    }

    private fun listVacancies(
        page: Int,
        limit: Int,
        sort: Map<String, String>,
        search: Map<String, List<String>>,
        salaryFrom: BigDecimal?,
        salaryTo: BigDecimal?,
        publishedOnly: Boolean,
        employerProfileId: UUID?,
    ): PageResponse<VacancyResponse> {
        validateSalaryRange(salaryFrom, salaryTo)
        val normalizedSearch = normalizeSearch(search)
        val pageable = buildPageable(
            page = page,
            limit = limit,
            sortRules = sort,
            supportedSorts = mapOf(
                "created_at" to "createdAt",
                "updated_at" to "updatedAt",
                "title" to "title",
                "salary_from" to "salaryFrom",
                "salary_to" to "salaryTo",
                "city" to "city",
            ),
            defaultSorts = listOf("createdAt" to Sort.Direction.DESC),
        )

        val spec = Specification<VacancyEntity> { root, query, cb ->
            query?.distinct(true)
            val predicates = mutableListOf<Predicate>()

            if (publishedOnly) {
                predicates += cb.equal(root.get<String>("status"), PublicationStatus.PUBLISHED.name)
            }

            employerProfileId?.let {
                val assignmentJoin = root.join<VacancyEntity, VacancyAssignmentEntity>("assignments", JoinType.INNER)
                val profileJoin = assignmentJoin.join<VacancyAssignmentEntity, EmployerProfileEntity>("employerProfile", JoinType.INNER)
                predicates += cb.equal(profileJoin.get<UUID>("id"), it)
            }

            normalizedSearch.forEach { (key, values) ->
                when (key) {
                    "title" -> predicates += likeAny(cb, root.get("title"), values)
                    "description" -> predicates += likeAny(cb, root.get("description"), values)
                    "company" -> predicates += likeAny(cb, root.join<VacancyEntity, CompanyEntity>("company", JoinType.INNER).get("title"), values)
                    "city" -> predicates += likeAny(cb, root.get("city"), values)
                    "industries" -> predicates += root.join<VacancyEntity, IndustryEntity>("industry", JoinType.INNER).get<String>("code").`in`(values)
                    "experience_levels" -> predicates += root.join<VacancyEntity, ExperienceLevelEntity>("experienceLevel", JoinType.INNER).get<String>("code").`in`(values)
                    "skills" -> predicates += root.join<VacancyEntity, SkillEntity>("skills", JoinType.INNER).get<String>("code").`in`(values)
                    "employment_types" -> predicates += root.get<String>("employmentType").`in`(values)
                    "work_formats" -> predicates += root.get<String>("workFormat").`in`(values)
                    "statuses" -> predicates += root.get<String>("status").`in`(values)
                    "requirement_text" -> predicates += likeAny(cb, root.join<VacancyEntity, VacancyRequirementEntity>("requirements", JoinType.INNER).get("value"), values)
                    "responsibility_text" -> predicates += likeAny(cb, root.join<VacancyEntity, VacancyResponsibilityEntity>("responsibilities", JoinType.INNER).get("value"), values)
                    "benefit_text" -> predicates += likeAny(cb, root.join<VacancyEntity, VacancyBenefitEntity>("benefits", JoinType.INNER).get("value"), values)
                }
            }

            salaryFrom?.let { minSalary ->
                predicates += cb.or(
                    cb.and(cb.isNotNull(root.get<BigDecimal>("salaryTo")), cb.greaterThanOrEqualTo(root.get("salaryTo"), minSalary)),
                    cb.and(cb.isNull(root.get<BigDecimal>("salaryTo")), cb.greaterThanOrEqualTo(root.get("salaryFrom"), minSalary)),
                )
            }

            salaryTo?.let { maxSalary ->
                predicates += cb.or(
                    cb.and(cb.isNotNull(root.get<BigDecimal>("salaryFrom")), cb.lessThanOrEqualTo(root.get("salaryFrom"), maxSalary)),
                    cb.and(cb.isNull(root.get<BigDecimal>("salaryFrom")), cb.lessThanOrEqualTo(root.get("salaryTo"), maxSalary)),
                )
            }

            cb.and(*predicates.toTypedArray())
        }

        return vacancyRepository.findAll(spec, pageable).toPageResponse(page, limit, vacancyMapper::toVacancyResponse)
    }

    private fun normalizeSearch(search: Map<String, List<String>>): LinkedHashMap<String, List<String>> {
        val normalized = LinkedHashMap<String, List<String>>()
        search.forEach { (key, rawValues) ->
            requireCondition(key in supportedSearchKeys, "Unsupported search field", "search[$key]")
            val values = rawValues.mapNotNull { value ->
                val normalizedValue = when (key) {
                    "industries", "experience_levels", "skills" -> normalizeCode(value)
                    "employment_types" -> parseEnumValue<EmploymentType>("search[$key]", value).name
                    "work_formats" -> parseEnumValue<WorkFormat>("search[$key]", value).name
                    "statuses" -> parseEnumValue<PublicationStatus>("search[$key]", value).name
                    else -> value.trim()
                }
                normalizedValue.takeIf { it.isNotBlank() }
            }
            if (values.isNotEmpty()) {
                normalized[key] = values
            }
        }
        return normalized
    }

    private fun validateVacancyPayload(
        salaryFrom: BigDecimal?,
        salaryTo: BigDecimal?,
        employmentType: String,
        workFormat: String,
        status: String,
    ) {
        validateSalaryRange(salaryFrom, salaryTo)
        parseEnumValue<EmploymentType>("employment_type", employmentType)
        parseEnumValue<WorkFormat>("work_format", workFormat)
        parseEnumValue<PublicationStatus>("status", status)
    }

    private fun syncVacancySkills(vacancy: VacancyEntity, skillIds: List<UUID>) {
        val distinctIds = skillIds.distinct()
        val skills = skillRepository.findAllById(distinctIds)
        requireCondition(skills.size == distinctIds.size, "One or more skills were not found", "skill_ids")
        vacancy.skills.clear()
        vacancy.skills.addAll(skills)
    }

    private fun syncVacancyRequirements(vacancy: VacancyEntity, items: List<OrderedTextItemRequest>) {
        vacancy.requirements.clear()
        items.forEachIndexed { index, item ->
            requireCondition(item.value.isNotBlank(), "requirements[$index] must not be blank", "requirements[$index].value")
            vacancy.requirements += vacancyMapper.fromRawData(
                vacancy = vacancy,
                value = item.value.trim(),
                sortOrder = item.sortOrder ?: index + 1,
            )
        }
    }

    private fun syncVacancyResponsibilities(vacancy: VacancyEntity, items: List<OrderedTextItemRequest>) {
        vacancy.responsibilities.clear()
        items.forEachIndexed { index, item ->
            requireCondition(item.value.isNotBlank(), "responsibilities[$index] must not be blank", "responsibilities[$index].value")
            vacancy.responsibilities += vacancyMapper.fromRawData(
                vacancy = vacancy,
                value = item.value.trim(),
                sortOrder = item.sortOrder ?: index + 1,
                responsibilityMarker = Unit,
            )
        }
    }

    private fun syncVacancyBenefits(vacancy: VacancyEntity, items: List<OrderedTextItemRequest>) {
        vacancy.benefits.clear()
        items.forEachIndexed { index, item ->
            requireCondition(item.value.isNotBlank(), "benefits[$index] must not be blank", "benefits[$index].value")
            vacancy.benefits += vacancyMapper.fromRawData(
                vacancy = vacancy,
                value = item.value.trim(),
                sortOrder = item.sortOrder ?: index + 1,
                benefitMarker = "benefit",
            )
        }
    }

    private fun managedVacancy(jwt: Jwt, vacancyId: UUID): VacancyEntity {
        val vacancy = vacancyRepository.findById(vacancyId).orElseThrow {
            ApiException(HttpStatus.NOT_FOUND, ApiErrorCode.NOT_FOUND, "Vacancy not found")
        }
        val profile = companyService.currentEmployerProfileEntity(jwt)
        if (!isEmployerAssigned(vacancy, profile.id!!)) {
            throw ApiException(HttpStatus.FORBIDDEN, ApiErrorCode.FORBIDDEN, "You are not assigned to this vacancy")
        }
        return vacancy
    }

    private fun findAssignmentForVacancy(vacancy: VacancyEntity, assignmentId: UUID): VacancyAssignmentEntity {
        val assignment = vacancyAssignmentRepository.findById(assignmentId).orElseThrow {
            ApiException(HttpStatus.NOT_FOUND, ApiErrorCode.NOT_FOUND, "Vacancy assignment not found")
        }
        requireCondition(assignment.vacancy.id == vacancy.id, "vacancy_assignment_id must belong to the same vacancy", "vacancy_assignment_id")
        return assignment
    }

    private fun isEmployerAssigned(vacancy: VacancyEntity, employerProfileId: UUID): Boolean =
        vacancy.assignments.any { it.employerProfile.id == employerProfileId }

    private fun likeAny(cb: CriteriaBuilder, expression: Expression<String>, values: List<String>): Predicate =
        cb.or(*values.map { cb.like(cb.lower(expression), "%${it.lowercase()}%") }.toTypedArray())
}
