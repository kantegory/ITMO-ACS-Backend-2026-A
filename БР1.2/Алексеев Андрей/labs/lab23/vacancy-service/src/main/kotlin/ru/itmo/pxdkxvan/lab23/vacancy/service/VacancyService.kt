package ru.itmo.pxdkxvan.lab23.vacancy.service

import org.springframework.data.domain.PageRequest
import org.springframework.data.domain.Sort
import org.springframework.security.oauth2.jwt.Jwt
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import ru.itmo.pxdkxvan.lab23.vacancy.client.CompanyClient
import ru.itmo.pxdkxvan.lab23.vacancy.config.VacancyProperties
import ru.itmo.pxdkxvan.lab23.vacancy.dto.DictionaryRequest
import ru.itmo.pxdkxvan.lab23.vacancy.dto.DictionaryResponse
import ru.itmo.pxdkxvan.lab23.vacancy.dto.Meta
import ru.itmo.pxdkxvan.lab23.vacancy.dto.PageResponse
import ru.itmo.pxdkxvan.lab23.vacancy.dto.VacancyApplicationContext
import ru.itmo.pxdkxvan.lab23.vacancy.dto.VacancyAssignmentRequest
import ru.itmo.pxdkxvan.lab23.vacancy.dto.VacancyAssignmentResponse
import ru.itmo.pxdkxvan.lab23.vacancy.dto.VacancyPublicContext
import ru.itmo.pxdkxvan.lab23.vacancy.dto.VacancyRequest
import ru.itmo.pxdkxvan.lab23.vacancy.dto.VacancyResponse
import ru.itmo.pxdkxvan.lab23.vacancy.entity.ExperienceLevelEntity
import ru.itmo.pxdkxvan.lab23.vacancy.entity.IndustryEntity
import ru.itmo.pxdkxvan.lab23.vacancy.entity.VacancyAssignmentEntity
import ru.itmo.pxdkxvan.lab23.vacancy.entity.VacancyEntity
import ru.itmo.pxdkxvan.lab23.vacancy.mapper.VacancyMapper
import ru.itmo.pxdkxvan.lab23.vacancy.repository.ExperienceLevelRepository
import ru.itmo.pxdkxvan.lab23.vacancy.repository.IndustryRepository
import ru.itmo.pxdkxvan.lab23.vacancy.repository.VacancyAssignmentRepository
import ru.itmo.pxdkxvan.lab23.vacancy.repository.VacancyRepository
import java.util.UUID

@Service
class VacancyService(
    private val industryRepository: IndustryRepository,
    private val experienceLevelRepository: ExperienceLevelRepository,
    private val vacancyRepository: VacancyRepository,
    private val vacancyAssignmentRepository: VacancyAssignmentRepository,
    private val companyClient: CompanyClient,
    private val vacancyEventPublisher: VacancyEventPublisher,
    private val vacancyProperties: VacancyProperties,
    private val vacancyMapper: VacancyMapper,
) {
    @Transactional
    fun createIndustry(request: DictionaryRequest): DictionaryResponse =
        industryRepository.save(IndustryEntity(code = request.code.trim(), displayName = request.displayName.trim()))
            .let(vacancyMapper::toIndustryResponse)

    @Transactional
    fun createExperienceLevel(request: DictionaryRequest): DictionaryResponse =
        experienceLevelRepository.save(ExperienceLevelEntity(code = request.code.trim(), displayName = request.displayName.trim()))
            .let(vacancyMapper::toExperienceLevelResponse)

    @Transactional
    fun createVacancy(jwt: Jwt, request: VacancyRequest): VacancyResponse {
        val userId = UUID.fromString(jwt.subject)
        val profile = companyClient.profileByUser(vacancyProperties.security.serviceToken, userId)
        val company = companyClient.getCompany(profile.companyId)

        return vacancyRepository.save(
            VacancyEntity(
                companyId = profile.companyId,
                createdByUserId = userId,
                title = request.title.trim(),
                description = request.description.trim(),
                country = request.country.trim(),
                city = request.city.trim(),
                metro = request.metro?.trim()?.ifBlank { null },
                salaryFrom = request.salaryFrom,
                salaryTo = request.salaryTo,
                currency = request.currency?.trim()?.ifBlank { null },
                industryCode = request.industryCode.trim(),
                experienceLevelCode = request.experienceLevelCode.trim(),
                employmentType = request.employmentType.trim().uppercase(),
                workFormat = request.workFormat.trim().uppercase(),
                educationLevel = request.educationLevel?.trim()?.ifBlank { null },
                companyName = company.title,
                status = request.status.trim().uppercase(),
                publishedAt = if (request.status.equals("PUBLISHED", true)) java.time.OffsetDateTime.now() else null,
                acceptsApplications = request.acceptsApplications,
                skillsCsv = request.skillCodes.joinToString(","),
            ),
        ).also { saved ->
            vacancyAssignmentRepository.save(
                VacancyAssignmentEntity(
                    vacancyId = saved.id,
                    employerProfileId = profile.employerProfileId,
                    employerUserId = profile.userId,
                    assignmentRole = "PRIMARY",
                ),
            )
            vacancyEventPublisher.publish("VacancyCreated", saved)
        }.let(vacancyMapper::toVacancyResponse)
    }

    @Transactional(readOnly = true)
    fun get(vacancyId: UUID): VacancyResponse = vacancyMapper.toVacancyResponse(vacancyRepository.findById(vacancyId).orElseThrow())

    @Transactional
    fun update(jwt: Jwt, vacancyId: UUID, request: VacancyRequest): VacancyResponse {
        val vacancy = managedVacancy(jwt, vacancyId)
        vacancy.title = request.title.trim()
        vacancy.description = request.description.trim()
        vacancy.country = request.country.trim()
        vacancy.city = request.city.trim()
        vacancy.metro = request.metro?.trim()?.ifBlank { null }
        vacancy.salaryFrom = request.salaryFrom
        vacancy.salaryTo = request.salaryTo
        vacancy.currency = request.currency?.trim()?.ifBlank { null }
        vacancy.industryCode = request.industryCode.trim()
        vacancy.experienceLevelCode = request.experienceLevelCode.trim()
        vacancy.employmentType = request.employmentType.trim().uppercase()
        vacancy.workFormat = request.workFormat.trim().uppercase()
        vacancy.educationLevel = request.educationLevel?.trim()?.ifBlank { null }
        vacancy.status = request.status.trim().uppercase()
        vacancy.acceptsApplications = request.acceptsApplications
        vacancy.skillsCsv = request.skillCodes.joinToString(",")
        if (vacancy.status == "PUBLISHED" && vacancy.publishedAt == null) {
            vacancy.publishedAt = java.time.OffsetDateTime.now()
        }

        return vacancyRepository.save(vacancy).also { vacancyEventPublisher.publish("VacancyUpdated", it) }
            .let(vacancyMapper::toVacancyResponse)
    }

    @Transactional
    fun delete(jwt: Jwt, vacancyId: UUID) {
        vacancyRepository.delete(managedVacancy(jwt, vacancyId))
        vacancyEventPublisher.publishDeleted(vacancyId)
    }

    @Transactional(readOnly = true)
    fun my(jwt: Jwt, page: Int, limit: Int): PageResponse<VacancyResponse> {
        val result = vacancyRepository.findAllByCreatedByUserId(
            UUID.fromString(jwt.subject),
            PageRequest.of(page - 1, limit, Sort.by(Sort.Direction.DESC, "publishedAt")),
        )

        return PageResponse(result.content.map(vacancyMapper::toVacancyResponse), Meta(page, limit, result.totalElements))
    }

    @Transactional(readOnly = true)
    fun listAssignments(jwt: Jwt, vacancyId: UUID): Map<String, List<VacancyAssignmentResponse>> {
        managedVacancy(jwt, vacancyId)
        return mapOf("items" to vacancyAssignmentRepository.findAllByVacancyId(vacancyId).map(vacancyMapper::toVacancyAssignmentResponse))
    }

    @Transactional
    fun createAssignment(jwt: Jwt, vacancyId: UUID, request: VacancyAssignmentRequest): VacancyAssignmentResponse =
        vacancyAssignmentRepository.save(
            VacancyAssignmentEntity(
                vacancyId = managedVacancy(jwt, vacancyId).id,
                employerProfileId = request.employerProfileId,
                employerUserId = UUID.fromString(jwt.subject),
                assignmentRole = request.assignmentRole.trim().uppercase(),
            ),
        ).also {
            vacancyEventPublisher.publish("VacancyAssignmentCreated", vacancyRepository.findById(vacancyId).orElseThrow())
        }.let(vacancyMapper::toVacancyAssignmentResponse)

    @Transactional
    fun updateAssignment(jwt: Jwt, assignmentId: UUID, request: VacancyAssignmentRequest): VacancyAssignmentResponse {
        val assignment = vacancyAssignmentRepository.findById(assignmentId).orElseThrow()
        managedVacancy(jwt, assignment.vacancyId!!)
        assignment.assignmentRole = request.assignmentRole.trim().uppercase()
        return vacancyAssignmentRepository.save(assignment).let(vacancyMapper::toVacancyAssignmentResponse)
    }

    @Transactional
    fun deleteAssignment(jwt: Jwt, assignmentId: UUID) {
        val assignment = vacancyAssignmentRepository.findById(assignmentId).orElseThrow()
        managedVacancy(jwt, assignment.vacancyId!!)
        vacancyAssignmentRepository.delete(assignment)
    }

    @Transactional(readOnly = true)
    fun applicationContext(serviceToken: String, vacancyId: UUID): VacancyApplicationContext {
        require(serviceToken == vacancyProperties.security.serviceToken) { "Invalid service token" }
        val vacancy = vacancyRepository.findById(vacancyId).orElseThrow()
        return VacancyApplicationContext(
            vacancyId = vacancy.id!!,
            companyId = vacancy.companyId!!,
            status = vacancy.status,
            acceptsApplications = vacancy.acceptsApplications && vacancy.status == "PUBLISHED",
            assignedEmployerUserIds = vacancyAssignmentRepository.findAllByVacancyId(vacancyId).mapNotNull { it.employerUserId },
        )
    }

    @Transactional(readOnly = true)
    fun publicContext(serviceToken: String, vacancyId: UUID): VacancyPublicContext {
        require(serviceToken == vacancyProperties.security.serviceToken) { "Invalid service token" }
        return vacancyRepository.findById(vacancyId).orElseThrow()
            .let { VacancyPublicContext(it.id!!, true, it.status == "PUBLISHED") }
    }

    private fun managedVacancy(jwt: Jwt, vacancyId: UUID): VacancyEntity {
        val userId = UUID.fromString(jwt.subject)
        val vacancy = vacancyRepository.findById(vacancyId).orElseThrow()
        require(vacancyAssignmentRepository.findAllByVacancyId(vacancyId).any { it.employerUserId == userId }) {
            "Employer is not assigned to this vacancy"
        }
        return vacancy
    }
}
