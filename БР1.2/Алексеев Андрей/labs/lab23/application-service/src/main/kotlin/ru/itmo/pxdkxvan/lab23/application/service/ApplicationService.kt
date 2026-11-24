package ru.itmo.pxdkxvan.lab23.application.service

import com.fasterxml.jackson.databind.ObjectMapper
import org.springframework.data.domain.PageRequest
import org.springframework.data.domain.Sort
import org.springframework.kafka.core.KafkaTemplate
import org.springframework.security.oauth2.jwt.Jwt
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import ru.itmo.pxdkxvan.lab23.application.client.ResumeClient
import ru.itmo.pxdkxvan.lab23.application.client.VacancyClient
import ru.itmo.pxdkxvan.lab23.application.config.ApplicationProperties
import ru.itmo.pxdkxvan.lab23.application.dto.ApplicationCreateRequest
import ru.itmo.pxdkxvan.lab23.application.dto.ApplicationEvent
import ru.itmo.pxdkxvan.lab23.application.dto.ApplicationResponse
import ru.itmo.pxdkxvan.lab23.application.dto.ApplicationStatusRequest
import ru.itmo.pxdkxvan.lab23.application.dto.InterviewInvitationRequest
import ru.itmo.pxdkxvan.lab23.application.dto.InterviewInvitationResponse
import ru.itmo.pxdkxvan.lab23.application.dto.Meta
import ru.itmo.pxdkxvan.lab23.application.dto.PageResponse
import ru.itmo.pxdkxvan.lab23.application.entity.ApplicationEntity
import ru.itmo.pxdkxvan.lab23.application.entity.InterviewInvitationEntity
import ru.itmo.pxdkxvan.lab23.application.mapper.ApplicationMapper
import ru.itmo.pxdkxvan.lab23.application.repository.ApplicationRepository
import ru.itmo.pxdkxvan.lab23.application.repository.InterviewInvitationRepository
import java.time.OffsetDateTime
import java.util.UUID

@Service
class ApplicationService(
    private val applications: ApplicationRepository,
    private val invitations: InterviewInvitationRepository,
    private val resumeClient: ResumeClient,
    private val vacancyClient: VacancyClient,
    private val kafkaTemplate: KafkaTemplate<String, String>,
    private val objectMapper: ObjectMapper,
    private val properties: ApplicationProperties,
    private val applicationMapper: ApplicationMapper,
) {
    @Transactional
    fun create(jwt: Jwt, vacancyId: UUID, request: ApplicationCreateRequest): ApplicationResponse {
        jwt.requireRole("APPLICANT")
        val userId = jwt.userId()
        val ownership = resumeClient.ownership(properties.security.serviceToken, request.resumeId, userId)
        require(ownership.ownedByUser) { "Resume does not belong to current user" }
        val vacancy = vacancyClient.applicationContext(properties.security.serviceToken, vacancyId)
        require(vacancy.acceptsApplications) { "Vacancy does not accept applications" }
        require(!applications.existsByVacancyIdAndResumeId(vacancyId, request.resumeId)) { "Application already exists" }
        val application = applications.save(
            ApplicationEntity(
                vacancyId = vacancyId,
                resumeId = request.resumeId,
                applicantUserId = userId,
                coverLetter = request.coverLetter.normalized(),
            ),
        )
        publish("ApplicationCreated", application)
        return applicationMapper.toApplicationResponse(application)
    }

    @Transactional(readOnly = true)
    fun my(jwt: Jwt, page: Int, limit: Int): PageResponse<ApplicationResponse> {
        val data = applications.findAllByApplicantUserId(
            jwt.userId(),
            PageRequest.of(page - 1, limit, Sort.by(Sort.Direction.DESC, "createdAt")),
        )
        return PageResponse(data.content.map(applicationMapper::toApplicationResponse), Meta(page, limit, data.totalElements))
    }

    @Transactional(readOnly = true)
    fun vacancy(jwt: Jwt, vacancyId: UUID, page: Int, limit: Int): PageResponse<ApplicationResponse> {
        jwt.requireRole("EMPLOYER")
        val context = vacancyClient.applicationContext(properties.security.serviceToken, vacancyId)
        require(context.assignedEmployerUserIds.contains(jwt.userId())) { "Access denied" }
        val data = applications.findAllByVacancyId(
            vacancyId,
            PageRequest.of(page - 1, limit, Sort.by(Sort.Direction.DESC, "createdAt")),
        )
        return PageResponse(data.content.map(applicationMapper::toApplicationResponse), Meta(page, limit, data.totalElements))
    }

    @Transactional
    fun updateStatus(jwt: Jwt, applicationId: UUID, request: ApplicationStatusRequest): ApplicationResponse {
        jwt.requireRole("EMPLOYER")
        val application = applications.findById(applicationId).orElseThrow()
        val context = vacancyClient.applicationContext(properties.security.serviceToken, application.vacancyId!!)
        require(context.assignedEmployerUserIds.contains(jwt.userId())) { "Access denied" }
        application.status = request.status.trim().uppercase()
        application.statusChangedAt = OffsetDateTime.now()
        return applications.save(application).also { publish("ApplicationStatusChanged", it) }
            .let(applicationMapper::toApplicationResponse)
    }

    @Transactional
    fun invite(jwt: Jwt, applicationId: UUID, request: InterviewInvitationRequest): InterviewInvitationResponse {
        jwt.requireRole("EMPLOYER")
        val application = applications.findById(applicationId).orElseThrow()
        val context = vacancyClient.applicationContext(properties.security.serviceToken, application.vacancyId!!)
        require(context.assignedEmployerUserIds.contains(jwt.userId())) { "Access denied" }
        val invitation = invitations.save(
            InterviewInvitationEntity(
                applicationId = applicationId,
                scheduledAt = request.scheduledAt,
                format = request.format.trim().uppercase(),
                notes = request.notes.normalized(),
            ),
        )
        publish("InterviewInvitationCreated", application)
        return applicationMapper.toInterviewInvitationResponse(invitation)
    }

    private fun publish(type: String, application: ApplicationEntity) {
        kafkaTemplate.send(
            "application.events",
            application.id.toString(),
            objectMapper.writeValueAsString(
                ApplicationEvent(
                    eventType = type,
                    applicationId = application.id!!,
                    applicantUserId = application.applicantUserId!!,
                    vacancyId = application.vacancyId!!,
                    status = application.status,
                    occurredAt = OffsetDateTime.now(),
                ),
            ),
        )
    }
}

private fun Jwt.requireRole(role: String) {
    require(getClaimAsStringList("roles").contains(role)) { "Role $role required" }
}

private fun Jwt.userId(): UUID = UUID.fromString(subject)

private fun String?.normalized(): String? = this?.trim()?.ifBlank { null }
