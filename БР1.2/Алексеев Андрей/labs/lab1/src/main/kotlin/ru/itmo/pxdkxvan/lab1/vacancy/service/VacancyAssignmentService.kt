package ru.itmo.pxdkxvan.lab1.vacancy.service

import org.springframework.http.HttpStatus
import org.springframework.security.oauth2.jwt.Jwt
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import ru.itmo.pxdkxvan.lab1.common.ApiErrorCode
import ru.itmo.pxdkxvan.lab1.common.ApiException
import ru.itmo.pxdkxvan.lab1.common.AssignmentRole
import ru.itmo.pxdkxvan.lab1.common.ItemsResponse
import ru.itmo.pxdkxvan.lab1.common.requireCondition
import ru.itmo.pxdkxvan.lab1.company.service.CompanyService
import ru.itmo.pxdkxvan.lab1.vacancy.entity.VacancyAssignmentEntity
import ru.itmo.pxdkxvan.lab1.vacancy.entity.VacancyEntity
import ru.itmo.pxdkxvan.lab1.vacancy.dto.VacancyAssignmentCreateRequest
import ru.itmo.pxdkxvan.lab1.vacancy.dto.VacancyAssignmentResponse
import ru.itmo.pxdkxvan.lab1.vacancy.dto.VacancyAssignmentUpdateRequest
import ru.itmo.pxdkxvan.lab1.vacancy.mapper.VacancyMapper
import ru.itmo.pxdkxvan.lab1.vacancy.repository.VacancyAssignmentRepository
import ru.itmo.pxdkxvan.lab1.vacancy.repository.VacancyRepository
import java.util.UUID

@Service
class VacancyAssignmentService(
    private val vacancyAssignmentRepository: VacancyAssignmentRepository,
    private val vacancyRepository: VacancyRepository,
    private val companyService: CompanyService,
    private val vacancyMapper: VacancyMapper,
) {
    @Transactional(readOnly = true)
    fun list(jwt: Jwt, vacancyId: UUID): ItemsResponse<VacancyAssignmentResponse> {
        val vacancy = managedVacancy(jwt, vacancyId)
        return ItemsResponse(vacancyAssignmentRepository.findAllByVacancyOrderByCreatedAtAsc(vacancy).map(vacancyMapper::toVacancyAssignmentResponse))
    }

    @Transactional
    fun create(jwt: Jwt, vacancyId: UUID, request: VacancyAssignmentCreateRequest): VacancyAssignmentResponse {
        val vacancy = managedVacancy(jwt, vacancyId)
        val employerProfile = companyService.findEmployerProfile(request.employerProfileId)
        requireCondition(employerProfile.company.id == vacancy.company.id, "employer_profile_id must belong to the same company", "employer_profile_id")
        val requestedRole = ru.itmo.pxdkxvan.lab1.common.parseEnumValue<AssignmentRole>("assignment_role", request.assignmentRole)
        if (vacancyAssignmentRepository.existsByVacancyAndEmployerProfile(vacancy, employerProfile)) {
            throw ApiException(HttpStatus.CONFLICT, ApiErrorCode.CONFLICT, "Employer profile is already assigned to this vacancy")
        }

        val assignment = vacancyAssignmentRepository.saveAndFlush(
            vacancyMapper.fromRawData(
                vacancy = vacancy,
                employerProfile = employerProfile,
                assignmentRole = requestedRole.name,
            ),
        )

        if (requestedRole == AssignmentRole.PRIMARY || vacancy.primaryAssignment == null) {
            promoteToPrimary(vacancy, assignment)
        }

        return vacancyMapper.toVacancyAssignmentResponse(
            vacancyAssignmentRepository.findById(assignment.id!!).orElseThrow {
                ApiException(HttpStatus.INTERNAL_SERVER_ERROR, ApiErrorCode.INTERNAL, "Vacancy assignment was not found after creation")
            },
        )
    }

    @Transactional
    fun update(jwt: Jwt, assignmentId: UUID, request: VacancyAssignmentUpdateRequest): VacancyAssignmentResponse {
        val assignment = managedAssignment(jwt, assignmentId)
        val requestedRole = ru.itmo.pxdkxvan.lab1.common.parseEnumValue<AssignmentRole>("assignment_role", request.assignmentRole)

        if (assignment.vacancy.primaryAssignment?.id == assignment.id && requestedRole != AssignmentRole.PRIMARY) {
            throw ApiException(HttpStatus.CONFLICT, ApiErrorCode.CONFLICT, "Primary assignment cannot be downgraded directly")
        }

        assignment.assignmentRole = requestedRole.name
        val saved = vacancyAssignmentRepository.save(assignment)
        if (requestedRole == AssignmentRole.PRIMARY) {
            promoteToPrimary(saved.vacancy, saved)
        }
        return vacancyMapper.toVacancyAssignmentResponse(saved)
    }

    @Transactional
    fun delete(jwt: Jwt, assignmentId: UUID) {
        val assignment = managedAssignment(jwt, assignmentId)
        val vacancy = assignment.vacancy

        if (vacancy.primaryAssignment?.id == assignment.id) {
            val remainingAssignments = vacancyAssignmentRepository.findAllByVacancyOrderByCreatedAtAsc(vacancy)
                .filterNot { it.id == assignment.id }
            if (remainingAssignments.isEmpty()) {
                throw ApiException(HttpStatus.CONFLICT, ApiErrorCode.CONFLICT, "Vacancy must keep at least one assignment")
            }

            val replacement = remainingAssignments.first()
            replacement.assignmentRole = AssignmentRole.PRIMARY.name
            vacancyAssignmentRepository.save(replacement)
            vacancy.primaryAssignment = replacement
            vacancyRepository.save(vacancy)
        }

        vacancyAssignmentRepository.delete(assignment)
    }

    private fun managedVacancy(jwt: Jwt, vacancyId: UUID): VacancyEntity {
        val vacancy = vacancyRepository.findById(vacancyId).orElseThrow {
            ApiException(HttpStatus.NOT_FOUND, ApiErrorCode.NOT_FOUND, "Vacancy not found")
        }
        val profile = companyService.currentEmployerProfileEntity(jwt)
        if (vacancy.assignments.none { it.employerProfile.id == profile.id }) {
            throw ApiException(HttpStatus.FORBIDDEN, ApiErrorCode.FORBIDDEN, "You are not assigned to this vacancy")
        }
        return vacancy
    }

    private fun managedAssignment(jwt: Jwt, assignmentId: UUID): VacancyAssignmentEntity {
        val assignment = vacancyAssignmentRepository.findById(assignmentId).orElseThrow {
            ApiException(HttpStatus.NOT_FOUND, ApiErrorCode.NOT_FOUND, "Vacancy assignment not found")
        }
        val profile = companyService.currentEmployerProfileEntity(jwt)
        if (assignment.vacancy.assignments.none { it.employerProfile.id == profile.id }) {
            throw ApiException(HttpStatus.FORBIDDEN, ApiErrorCode.FORBIDDEN, "You are not assigned to this vacancy")
        }
        return assignment
    }

    private fun promoteToPrimary(vacancy: VacancyEntity, assignment: VacancyAssignmentEntity) {
        val currentPrimary = vacancy.primaryAssignment
        if (currentPrimary != null && currentPrimary.id != assignment.id && currentPrimary.assignmentRole == AssignmentRole.PRIMARY.name) {
            currentPrimary.assignmentRole = AssignmentRole.RECRUITER.name
            vacancyAssignmentRepository.save(currentPrimary)
        }
        assignment.assignmentRole = AssignmentRole.PRIMARY.name
        vacancyAssignmentRepository.save(assignment)
        vacancy.primaryAssignment = assignment
        vacancyRepository.save(vacancy)
    }
}
