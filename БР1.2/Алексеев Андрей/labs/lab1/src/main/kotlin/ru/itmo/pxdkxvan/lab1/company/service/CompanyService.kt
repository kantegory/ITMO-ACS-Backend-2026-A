package ru.itmo.pxdkxvan.lab1.company.service

import org.springframework.http.HttpStatus
import org.springframework.security.oauth2.jwt.Jwt
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import ru.itmo.pxdkxvan.lab1.common.ApiErrorCode
import ru.itmo.pxdkxvan.lab1.common.ApiException
import ru.itmo.pxdkxvan.lab1.common.SystemRole
import ru.itmo.pxdkxvan.lab1.common.requireCondition
import ru.itmo.pxdkxvan.lab1.company.dto.CompanyCreateRequest
import ru.itmo.pxdkxvan.lab1.company.dto.CompanyResponse
import ru.itmo.pxdkxvan.lab1.company.dto.CompanyUpdateRequest
import ru.itmo.pxdkxvan.lab1.company.dto.EmployerProfileCreateRequest
import ru.itmo.pxdkxvan.lab1.company.dto.EmployerProfileResponse
import ru.itmo.pxdkxvan.lab1.company.dto.EmployerProfileUpdateRequest
import ru.itmo.pxdkxvan.lab1.company.entity.CompanyEntity
import ru.itmo.pxdkxvan.lab1.company.entity.EmployerProfileEntity
import ru.itmo.pxdkxvan.lab1.company.mapper.CompanyMapper
import ru.itmo.pxdkxvan.lab1.company.repository.CompanyRepository
import ru.itmo.pxdkxvan.lab1.company.repository.EmployerProfileRepository
import ru.itmo.pxdkxvan.lab1.user.service.CurrentUserService
import java.math.BigDecimal
import java.util.UUID

@Service
class CompanyService(
    private val currentUserService: CurrentUserService,
    private val companyRepository: CompanyRepository,
    private val employerProfileRepository: EmployerProfileRepository,
    private val companyMapper: CompanyMapper,
) {

    @Transactional
    fun createCompany(jwt: Jwt, request: CompanyCreateRequest): CompanyResponse {
        currentUserService.currentUserWithRole(jwt, SystemRole.EMPLOYER)
        validateEmployeeCount(request.employeeCount)

        val company = companyMapper.fromRawData(
            title = request.title.trim(),
            description = request.description?.trim()?.ifBlank { null },
            website = request.website?.trim()?.ifBlank { null },
            industryHint = request.industryHint?.trim()?.ifBlank { null },
            address = request.address?.trim()?.ifBlank { null },
            employeeCount = request.employeeCount?.stripTrailingZeros(),
        )
        val saved = companyRepository.saveAndFlush(company)
        return companyMapper.toCompanyResponse(findCompany(saved.id!!))
    }

    @Transactional(readOnly = true)
    fun getCompany(companyId: UUID): CompanyResponse = companyMapper.toCompanyResponse(findCompany(companyId))

    @Transactional
    fun updateCompany(jwt: Jwt, companyId: UUID, request: CompanyUpdateRequest): CompanyResponse {
        val user = currentUserService.currentUserWithRole(jwt, SystemRole.EMPLOYER)
        val employerProfile = employerProfileRepository.findByUser(user)
            ?: throw ApiException(HttpStatus.NOT_FOUND, ApiErrorCode.NOT_FOUND, "Employer profile not found")
        val company = findCompany(companyId)
        if (company.id != employerProfile.company.id) {
            throw ApiException(HttpStatus.FORBIDDEN, ApiErrorCode.FORBIDDEN, "You can update only your company")
        }

        request.title?.let {
            requireCondition(it.isNotBlank(), "title must not be blank", "title")
            company.title = it.trim()
        }
        if (request.description != null) company.description = request.description.trim().ifBlank { null }
        if (request.website != null) company.website = request.website.trim().ifBlank { null }
        if (request.industryHint != null) company.industryHint = request.industryHint.trim().ifBlank { null }
        if (request.address != null) company.address = request.address.trim().ifBlank { null }
        if (request.employeeCount != null) {
            validateEmployeeCount(request.employeeCount)
            company.employeeCount = request.employeeCount.stripTrailingZeros()
        }

        return companyMapper.toCompanyResponse(companyRepository.save(company))
    }

    @Transactional
    fun createEmployerProfile(jwt: Jwt, request: EmployerProfileCreateRequest): EmployerProfileResponse {
        val user = currentUserService.currentUserWithRole(jwt, SystemRole.EMPLOYER)
        val company = findCompany(request.companyId)
        val profile = employerProfileRepository.findByUser(user)?.also {
            it.company = company
            it.position = request.position.trim()
        } ?: companyMapper.fromRawData(
            user = user,
            company = company,
            position = request.position.trim(),
        )
        val saved = employerProfileRepository.saveAndFlush(profile)

        return companyMapper.toEmployerProfileResponse(findEmployerProfile(saved.id!!))
    }

    @Transactional(readOnly = true)
    fun currentEmployerProfile(jwt: Jwt): EmployerProfileResponse = companyMapper.toEmployerProfileResponse(currentEmployerProfileEntity(jwt))

    @Transactional(readOnly = true)
    fun currentEmployerProfileEntity(jwt: Jwt): EmployerProfileEntity {
        val user = currentUserService.currentUserWithRole(jwt, SystemRole.EMPLOYER)
        return employerProfileRepository.findByUser(user)
            ?: throw ApiException(HttpStatus.NOT_FOUND, ApiErrorCode.NOT_FOUND, "Employer profile not found")
    }

    @Transactional
    fun updateCurrentEmployerProfile(jwt: Jwt, request: EmployerProfileUpdateRequest): EmployerProfileResponse {
        val profile = currentEmployerProfileEntity(jwt)
        request.companyId?.let { profile.company = findCompany(it) }
        request.position?.let {
            requireCondition(it.isNotBlank(), "position must not be blank", "position")
            profile.position = it.trim()
        }
        return companyMapper.toEmployerProfileResponse(employerProfileRepository.save(profile))
    }

    fun findCompany(id: UUID): CompanyEntity =
        companyRepository.findById(id).orElseThrow {
            ApiException(HttpStatus.NOT_FOUND, ApiErrorCode.NOT_FOUND, "Company not found")
        }

    fun findEmployerProfile(id: UUID): EmployerProfileEntity =
        employerProfileRepository.findById(id).orElseThrow {
            ApiException(HttpStatus.NOT_FOUND, ApiErrorCode.NOT_FOUND, "Employer profile not found")
        }

    private fun validateEmployeeCount(employeeCount: BigDecimal?) {
        if (employeeCount != null) {
            requireCondition(employeeCount.signum() >= 0, "employee_count must be greater than or equal to 0", "employee_count")
            requireCondition(employeeCount.stripTrailingZeros().scale() <= 0, "employee_count must be a whole number", "employee_count")
        }
    }
}
