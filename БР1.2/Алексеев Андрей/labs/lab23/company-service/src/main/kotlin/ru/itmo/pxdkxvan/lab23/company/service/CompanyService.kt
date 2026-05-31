package ru.itmo.pxdkxvan.lab23.company.service

import org.springframework.security.oauth2.jwt.Jwt
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import ru.itmo.pxdkxvan.lab23.company.dto.CompanyRequest
import ru.itmo.pxdkxvan.lab23.company.dto.CompanyResponse
import ru.itmo.pxdkxvan.lab23.company.dto.EmployerProfileContext
import ru.itmo.pxdkxvan.lab23.company.dto.EmployerProfileRequest
import ru.itmo.pxdkxvan.lab23.company.dto.EmployerProfileResponse
import ru.itmo.pxdkxvan.lab23.company.entity.CompanyEntity
import ru.itmo.pxdkxvan.lab23.company.entity.EmployerProfileEntity
import ru.itmo.pxdkxvan.lab23.company.mapper.CompanyMapper
import ru.itmo.pxdkxvan.lab23.company.repository.CompanyRepository
import ru.itmo.pxdkxvan.lab23.company.repository.EmployerProfileRepository
import java.util.UUID

@Service
class CompanyService(
    private val companyRepository: CompanyRepository,
    private val employerProfileRepository: EmployerProfileRepository,
    private val companyEventPublisher: CompanyEventPublisher,
    private val companyMapper: CompanyMapper,
) {
    @Transactional
    fun createCompany(jwt: Jwt, request: CompanyRequest): CompanyResponse {
        requireEmployer(jwt)
        val ownerUserId = UUID.fromString(jwt.subject)

        return companyRepository.save(
            CompanyEntity(
                title = request.title.trim(),
                ownerUserId = ownerUserId,
                description = request.description?.trim()?.ifBlank { null },
                website = request.website?.trim()?.ifBlank { null },
                industryHint = request.industryHint?.trim()?.ifBlank { null },
                address = request.address?.trim()?.ifBlank { null },
                employeeCount = request.employeeCount,
            ),
        ).also { companyEventPublisher.publish("CompanyCreated", it) }
            .let(companyMapper::toCompanyResponse)
    }

    @Transactional(readOnly = true)
    fun getCompany(companyId: UUID): CompanyResponse = companyMapper.toCompanyResponse(companyRepository.findById(companyId).orElseThrow())

    @Transactional
    fun updateCompany(jwt: Jwt, companyId: UUID, request: CompanyRequest): CompanyResponse {
        requireEmployer(jwt)
        val userId = UUID.fromString(jwt.subject)

        val company = companyRepository.findById(companyId).orElseThrow()
        require(company.ownerUserId == userId) { "Only company owner can update company" }
        company.title = request.title.trim()
        company.description = request.description?.trim()?.ifBlank { null }
        company.website = request.website?.trim()?.ifBlank { null }
        company.industryHint = request.industryHint?.trim()?.ifBlank { null }
        company.address = request.address?.trim()?.ifBlank { null }
        company.employeeCount = request.employeeCount

        return companyRepository.save(company).also { companyEventPublisher.publish("CompanyUpdated", it) }
            .let(companyMapper::toCompanyResponse)
    }

    @Transactional
    fun createOrUpdateProfile(jwt: Jwt, request: EmployerProfileRequest): EmployerProfileResponse {
        requireEmployer(jwt)
        companyRepository.findById(request.companyId).orElseThrow()

        val userId = UUID.fromString(jwt.subject)
        val profile = employerProfileRepository.findByUserId(userId) ?: EmployerProfileEntity(userId = userId)
        profile.companyId = request.companyId
        profile.position = request.position.trim()

        return employerProfileRepository.save(profile).let(companyMapper::toEmployerProfileResponse)
    }

    @Transactional(readOnly = true)
    fun myProfile(jwt: Jwt): EmployerProfileResponse =
        employerProfileRepository.findByUserId(UUID.fromString(jwt.subject))
            ?.let(companyMapper::toEmployerProfileResponse)
            ?: throw NoSuchElementException("Employer profile not found")

    @Transactional(readOnly = true)
    fun profileByUser(serviceToken: String, expectedToken: String, userId: UUID): EmployerProfileContext {
        require(serviceToken == expectedToken) { "Invalid service token" }

        return employerProfileRepository.findByUserId(userId)
            ?.let(companyMapper::toEmployerProfileContext)
            ?: throw NoSuchElementException("Employer profile not found")
    }

    private fun requireEmployer(jwt: Jwt) {
        require(jwt.getClaimAsStringList("roles").contains("EMPLOYER")) { "EMPLOYER role required" }
    }
}
