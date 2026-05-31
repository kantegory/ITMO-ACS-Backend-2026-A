package ru.itmo.pxdkxvan.lab1.interaction.service

import org.springframework.data.domain.Sort
import org.springframework.http.HttpStatus
import org.springframework.security.oauth2.jwt.Jwt
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import ru.itmo.pxdkxvan.lab1.common.ApiErrorCode
import ru.itmo.pxdkxvan.lab1.common.ApiException
import ru.itmo.pxdkxvan.lab1.common.ApplicationStatus
import ru.itmo.pxdkxvan.lab1.common.PageResponse
import ru.itmo.pxdkxvan.lab1.common.SystemRole
import ru.itmo.pxdkxvan.lab1.common.buildPageable
import ru.itmo.pxdkxvan.lab1.common.parseEnumValue
import ru.itmo.pxdkxvan.lab1.common.toPageResponse
import ru.itmo.pxdkxvan.lab1.vacancy.entity.VacancyEntity
import ru.itmo.pxdkxvan.lab1.interaction.dto.ApplicationCreateRequest
import ru.itmo.pxdkxvan.lab1.interaction.dto.ApplicationResponse
import ru.itmo.pxdkxvan.lab1.interaction.dto.ApplicationStatusUpdateRequest
import ru.itmo.pxdkxvan.lab1.interaction.dto.FavoriteVacancyResponse
import ru.itmo.pxdkxvan.lab1.interaction.dto.VacancyViewResponse
import ru.itmo.pxdkxvan.lab1.company.service.CompanyService
import ru.itmo.pxdkxvan.lab1.interaction.mapper.FavoriteMarker
import ru.itmo.pxdkxvan.lab1.interaction.mapper.InteractionMapper
import ru.itmo.pxdkxvan.lab1.interaction.mapper.VacancyViewMarker
import ru.itmo.pxdkxvan.lab1.interaction.repository.ApplicationRepository
import ru.itmo.pxdkxvan.lab1.interaction.repository.FavoriteVacancyRepository
import ru.itmo.pxdkxvan.lab1.resume.repository.ResumeRepository
import ru.itmo.pxdkxvan.lab1.user.service.CurrentUserService
import ru.itmo.pxdkxvan.lab1.vacancy.repository.VacancyRepository
import ru.itmo.pxdkxvan.lab1.interaction.repository.VacancyViewRepository
import java.time.OffsetDateTime
import java.util.UUID

@Service
class InteractionService(
    private val currentUserService: CurrentUserService,
    private val resumeRepository: ResumeRepository,
    private val vacancyRepository: VacancyRepository,
    private val applicationRepository: ApplicationRepository,
    private val favoriteVacancyRepository: FavoriteVacancyRepository,
    private val vacancyViewRepository: VacancyViewRepository,
    private val companyService: CompanyService,
    private val interactionMapper: InteractionMapper,
) {
    @Transactional
    fun createApplication(jwt: Jwt, vacancyId: UUID, request: ApplicationCreateRequest): ApplicationResponse {
        val applicant = currentUserService.currentUserWithRole(jwt, SystemRole.APPLICANT)
        val vacancy = publishedVacancy(vacancyId)
        val resume = resumeRepository.findById(request.resumeId).orElseThrow {
            ApiException(HttpStatus.NOT_FOUND, ApiErrorCode.NOT_FOUND, "Resume not found")
        }
        if (resume.user.id != applicant.id) {
            throw ApiException(HttpStatus.FORBIDDEN, ApiErrorCode.FORBIDDEN, "You can apply only with your own resume")
        }
        if (applicationRepository.existsByVacancyAndResume(vacancy, resume)) {
            throw ApiException(HttpStatus.CONFLICT, ApiErrorCode.CONFLICT, "Application already exists")
        }

        val entity = interactionMapper.fromRawData(
            resume = resume,
            vacancy = vacancy,
            coverLetter = request.coverLetter?.trim()?.ifBlank { null },
            status = ApplicationStatus.PENDING.name,
            statusChangedAt = OffsetDateTime.now(),
        )
        val saved = applicationRepository.saveAndFlush(entity)
        return interactionMapper.toApplicationResponse(
            applicationRepository.findById(saved.id!!).orElseThrow {
                ApiException(HttpStatus.INTERNAL_SERVER_ERROR, ApiErrorCode.INTERNAL, "Application was not found after creation")
            },
        )
    }

    @Transactional(readOnly = true)
    fun vacancyApplications(jwt: Jwt, vacancyId: UUID, page: Int, limit: Int): PageResponse<ApplicationResponse> {
        val vacancy = managedVacancy(jwt, vacancyId)
        val pageable = buildPageable(page, limit, emptyMap(), emptyMap(), listOf("createdAt" to Sort.Direction.DESC))
        return applicationRepository.findAllByVacancy(vacancy, pageable).toPageResponse(page, limit, interactionMapper::toApplicationResponse)
    }

    @Transactional(readOnly = true)
    fun myApplications(jwt: Jwt, page: Int, limit: Int): PageResponse<ApplicationResponse> {
        val user = currentUserService.currentUserWithRole(jwt, SystemRole.APPLICANT)
        val pageable = buildPageable(page, limit, emptyMap(), emptyMap(), listOf("createdAt" to Sort.Direction.DESC))
        return applicationRepository.findAllByApplicant(user, pageable).toPageResponse(page, limit, interactionMapper::toApplicationResponse)
    }

    @Transactional
    fun updateApplicationStatus(jwt: Jwt, applicationId: UUID, request: ApplicationStatusUpdateRequest): ApplicationResponse {
        val application = applicationRepository.findById(applicationId).orElseThrow {
            ApiException(HttpStatus.NOT_FOUND, ApiErrorCode.NOT_FOUND, "Application not found")
        }
        managedVacancy(jwt, application.vacancy.id!!)
        application.status = parseEnumValue<ApplicationStatus>("status", request.status).name
        application.statusChangedAt = OffsetDateTime.now()
        return interactionMapper.toApplicationResponse(applicationRepository.save(application))
    }

    @Transactional(readOnly = true)
    fun myFavorites(jwt: Jwt, page: Int, limit: Int): PageResponse<FavoriteVacancyResponse> {
        val user = currentUserService.currentUser(jwt)
        val pageable = buildPageable(page, limit, emptyMap(), emptyMap(), listOf("createdAt" to Sort.Direction.DESC))
        return favoriteVacancyRepository.findAllByUser(user, pageable).toPageResponse(page, limit, interactionMapper::toFavoriteVacancyResponse)
    }

    @Transactional
    fun addFavorite(jwt: Jwt, vacancyId: UUID): FavoriteVacancyResponse {
        val user = currentUserService.currentUser(jwt)
        val vacancy = visibleVacancy(jwt, vacancyId)
        if (favoriteVacancyRepository.findByUserAndVacancy(user, vacancy) != null) {
            throw ApiException(HttpStatus.CONFLICT, ApiErrorCode.CONFLICT, "Vacancy is already in favorites")
        }
        val entity = interactionMapper.fromRawData(
            user = user,
            vacancy = vacancy,
            favoriteMarker = FavoriteMarker.FAVORITE,
        )
        val saved = favoriteVacancyRepository.saveAndFlush(entity)
        return interactionMapper.toFavoriteVacancyResponse(
            favoriteVacancyRepository.findById(saved.id!!).orElseThrow {
                ApiException(HttpStatus.INTERNAL_SERVER_ERROR, ApiErrorCode.INTERNAL, "Favorite vacancy was not found after creation")
            },
        )
    }

    @Transactional
    fun removeFavorite(jwt: Jwt, vacancyId: UUID) {
        val user = currentUserService.currentUser(jwt)
        val vacancy = visibleVacancy(jwt, vacancyId)
        val favorite = favoriteVacancyRepository.findByUserAndVacancy(user, vacancy)
            ?: throw ApiException(HttpStatus.NOT_FOUND, ApiErrorCode.NOT_FOUND, "Favorite vacancy not found")
        favoriteVacancyRepository.delete(favorite)
    }

    @Transactional(readOnly = true)
    fun myVacancyViews(jwt: Jwt, page: Int, limit: Int): PageResponse<VacancyViewResponse> {
        val user = currentUserService.currentUser(jwt)
        val pageable = buildPageable(page, limit, emptyMap(), emptyMap(), listOf("createdAt" to Sort.Direction.DESC))
        return vacancyViewRepository.findAllByUser(user, pageable).toPageResponse(page, limit, interactionMapper::toVacancyViewResponse)
    }

    @Transactional
    fun createVacancyView(jwt: Jwt, vacancyId: UUID): VacancyViewResponse {
        val user = currentUserService.currentUser(jwt)
        val entity = interactionMapper.fromRawData(
            user = user,
            vacancy = visibleVacancy(jwt, vacancyId),
            vacancyViewMarker = VacancyViewMarker.VIEW,
        )
        val saved = vacancyViewRepository.saveAndFlush(entity)
        return interactionMapper.toVacancyViewResponse(
            vacancyViewRepository.findById(saved.id!!).orElseThrow {
                ApiException(HttpStatus.INTERNAL_SERVER_ERROR, ApiErrorCode.INTERNAL, "Vacancy view was not found after creation")
            },
        )
    }

    private fun publishedVacancy(vacancyId: UUID): VacancyEntity {
        val vacancy = vacancyRepository.findById(vacancyId).orElseThrow {
            ApiException(HttpStatus.NOT_FOUND, ApiErrorCode.NOT_FOUND, "Vacancy not found")
        }
        if (vacancy.status != "PUBLISHED") {
            throw ApiException(HttpStatus.NOT_FOUND, ApiErrorCode.NOT_FOUND, "Vacancy not found")
        }
        return vacancy
    }

    private fun visibleVacancy(jwt: Jwt?, vacancyId: UUID): VacancyEntity {
        val vacancy = vacancyRepository.findById(vacancyId).orElseThrow {
            ApiException(HttpStatus.NOT_FOUND, ApiErrorCode.NOT_FOUND, "Vacancy not found")
        }
        if (vacancy.status == "PUBLISHED") {
            return vacancy
        }
        if (jwt == null) {
            throw ApiException(HttpStatus.NOT_FOUND, ApiErrorCode.NOT_FOUND, "Vacancy not found")
        }
        val profile = runCatching { companyService.currentEmployerProfileEntity(jwt) }.getOrNull()
        if (profile == null || vacancy.assignments.none { it.employerProfile.id == profile.id }) {
            throw ApiException(HttpStatus.NOT_FOUND, ApiErrorCode.NOT_FOUND, "Vacancy not found")
        }
        return vacancy
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
}
