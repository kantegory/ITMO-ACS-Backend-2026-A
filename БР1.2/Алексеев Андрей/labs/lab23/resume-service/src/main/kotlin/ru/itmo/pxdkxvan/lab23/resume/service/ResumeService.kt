package ru.itmo.pxdkxvan.lab23.resume.service

import org.springframework.data.domain.PageRequest
import org.springframework.data.domain.Sort
import org.springframework.security.oauth2.jwt.Jwt
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import ru.itmo.pxdkxvan.lab23.resume.dto.Meta
import ru.itmo.pxdkxvan.lab23.resume.dto.PageResponse
import ru.itmo.pxdkxvan.lab23.resume.dto.ResumeOwnershipResponse
import ru.itmo.pxdkxvan.lab23.resume.dto.ResumeRequest
import ru.itmo.pxdkxvan.lab23.resume.dto.ResumeResponse
import ru.itmo.pxdkxvan.lab23.resume.entity.ResumeEntity
import ru.itmo.pxdkxvan.lab23.resume.mapper.ResumeMapper
import ru.itmo.pxdkxvan.lab23.resume.repository.ResumeRepository
import java.util.UUID

@Service
class ResumeService(
    private val resumeRepository: ResumeRepository,
    private val resumeMapper: ResumeMapper,
) {
    @Transactional(readOnly = true)
    fun list(jwt: Jwt, page: Int, limit: Int): PageResponse<ResumeResponse> {
        requireApplicant(jwt)
        val result = resumeRepository.findAllByUserId(
            UUID.fromString(jwt.subject),
            PageRequest.of(page - 1, limit, Sort.by(Sort.Direction.DESC, "id")),
        )
        return PageResponse(result.content.map(resumeMapper::toResumeResponse), Meta(page, limit, result.totalElements))
    }

    @Transactional
    fun create(jwt: Jwt, request: ResumeRequest): ResumeResponse {
        requireApplicant(jwt)
        return resumeRepository.save(
            ResumeEntity(
                userId = UUID.fromString(jwt.subject),
                title = request.title.trim(),
                desiredPosition = request.desiredPosition.trim(),
                aboutMe = request.aboutMe.trim(),
                salaryExpectation = request.salaryExpectation,
                city = request.city.trim(),
                employmentType = request.employmentType.trim(),
                workFormat = request.workFormat.trim(),
                status = request.status.trim().uppercase(),
                educationLevel = request.educationLevel?.trim()?.ifBlank { null },
                experienceLevelCode = request.experienceLevelCode?.trim()?.ifBlank { null },
                skillsCsv = request.skillCodes.joinToString(","),
            ),
        ).let(resumeMapper::toResumeResponse)
    }

    @Transactional(readOnly = true)
    fun get(jwt: Jwt, resumeId: UUID): ResumeResponse = resumeMapper.toResumeResponse(ownedResume(jwt, resumeId))

    @Transactional
    fun update(jwt: Jwt, resumeId: UUID, request: ResumeRequest): ResumeResponse =
        ownedResume(jwt, resumeId).apply {
            title = request.title.trim()
            desiredPosition = request.desiredPosition.trim()
            aboutMe = request.aboutMe.trim()
            salaryExpectation = request.salaryExpectation
            city = request.city.trim()
            employmentType = request.employmentType.trim()
            workFormat = request.workFormat.trim()
            status = request.status.trim().uppercase()
            educationLevel = request.educationLevel?.trim()?.ifBlank { null }
            experienceLevelCode = request.experienceLevelCode?.trim()?.ifBlank { null }
            skillsCsv = request.skillCodes.joinToString(",")
        }.let(resumeRepository::save).let(resumeMapper::toResumeResponse)

    @Transactional
    fun delete(jwt: Jwt, resumeId: UUID) {
        resumeRepository.delete(ownedResume(jwt, resumeId))
    }

    @Transactional(readOnly = true)
    fun ownership(serviceToken: String, expectedToken: String, resumeId: UUID, userId: UUID): ResumeOwnershipResponse {
        require(serviceToken == expectedToken) { "Invalid service token" }
        return resumeRepository.findById(resumeId).orElseThrow()
            .let { ResumeOwnershipResponse(it.id!!, it.userId!!, it.userId == userId, it.status) }
    }

    private fun ownedResume(jwt: Jwt, resumeId: UUID): ResumeEntity {
        requireApplicant(jwt)
        return resumeRepository.findById(resumeId).orElseThrow().also {
            require(it.userId == UUID.fromString(jwt.subject)) { "You can access only your resumes" }
        }
    }

    private fun requireApplicant(jwt: Jwt) {
        require(jwt.getClaimAsStringList("roles").contains("APPLICANT")) { "APPLICANT role required" }
    }
}
