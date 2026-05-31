package ru.itmo.pxdkxvan.lab23.vacancy.controller

import io.swagger.v3.oas.annotations.security.SecurityRequirement
import org.springframework.security.oauth2.jwt.Jwt
import org.springframework.security.core.annotation.AuthenticationPrincipal
import org.springframework.web.bind.annotation.DeleteMapping
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PatchMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RestController
import ru.itmo.pxdkxvan.lab23.vacancy.dto.DictionaryRequest
import ru.itmo.pxdkxvan.lab23.vacancy.dto.VacancyAssignmentRequest
import ru.itmo.pxdkxvan.lab23.vacancy.dto.VacancyRequest
import ru.itmo.pxdkxvan.lab23.vacancy.mapper.VacancyMapper
import ru.itmo.pxdkxvan.lab23.vacancy.repository.ExperienceLevelRepository
import ru.itmo.pxdkxvan.lab23.vacancy.repository.IndustryRepository
import ru.itmo.pxdkxvan.lab23.vacancy.service.VacancyService
import java.util.UUID

@RestController
class VacancyController(
    private val vacancyService: VacancyService,
    private val industryRepository: IndustryRepository,
    private val experienceLevelRepository: ExperienceLevelRepository,
    private val vacancyMapper: VacancyMapper,
) {
    @GetMapping("/industries")
    fun industries() = mapOf("items" to industryRepository.findAll().sortedBy { it.displayName }.map(vacancyMapper::toIndustryResponse))

    @PostMapping("/industries")
    @SecurityRequirement(name = "bearerAuth")
    fun createIndustry(@RequestBody request: DictionaryRequest) = vacancyService.createIndustry(request)

    @GetMapping("/experience-levels")
    fun experienceLevels() = mapOf("items" to experienceLevelRepository.findAll().sortedBy { it.displayName }.map(vacancyMapper::toExperienceLevelResponse))

    @PostMapping("/experience-levels")
    @SecurityRequirement(name = "bearerAuth")
    fun createExperienceLevel(@RequestBody request: DictionaryRequest) = vacancyService.createExperienceLevel(request)

    @PostMapping("/vacancies")
    @SecurityRequirement(name = "bearerAuth")
    fun create(@AuthenticationPrincipal authentication: Jwt, @RequestBody request: VacancyRequest) =
        vacancyService.createVacancy(authentication, request)

    @GetMapping("/vacancies/{vacancyId}")
    fun get(@PathVariable vacancyId: UUID) = vacancyService.get(vacancyId)

    @PatchMapping("/vacancies/{vacancyId}")
    @SecurityRequirement(name = "bearerAuth")
    fun update(@AuthenticationPrincipal authentication: Jwt, @PathVariable vacancyId: UUID, @RequestBody request: VacancyRequest) =
        vacancyService.update(authentication, vacancyId, request)

    @DeleteMapping("/vacancies/{vacancyId}")
    @SecurityRequirement(name = "bearerAuth")
    fun delete(@AuthenticationPrincipal authentication: Jwt, @PathVariable vacancyId: UUID) = vacancyService.delete(authentication, vacancyId)

    @GetMapping("/vacancies/my")
    @SecurityRequirement(name = "bearerAuth")
    fun my(
        @AuthenticationPrincipal authentication: Jwt,
        @RequestParam(defaultValue = "1") page: Int,
        @RequestParam(defaultValue = "20") limit: Int,
    ) = vacancyService.my(authentication, page, limit)

    @GetMapping("/vacancies/{vacancyId}/assignments")
    @SecurityRequirement(name = "bearerAuth")
    fun assignments(@AuthenticationPrincipal authentication: Jwt, @PathVariable vacancyId: UUID) =
        vacancyService.listAssignments(authentication, vacancyId)

    @PostMapping("/vacancies/{vacancyId}/assignments")
    @SecurityRequirement(name = "bearerAuth")
    fun createAssignment(@AuthenticationPrincipal authentication: Jwt, @PathVariable vacancyId: UUID, @RequestBody request: VacancyAssignmentRequest) =
        vacancyService.createAssignment(authentication, vacancyId, request)

    @PatchMapping("/vacancy-assignments/{assignmentId}")
    @SecurityRequirement(name = "bearerAuth")
    fun updateAssignment(@AuthenticationPrincipal authentication: Jwt, @PathVariable assignmentId: UUID, @RequestBody request: VacancyAssignmentRequest) =
        vacancyService.updateAssignment(authentication, assignmentId, request)

    @DeleteMapping("/vacancy-assignments/{assignmentId}")
    @SecurityRequirement(name = "bearerAuth")
    fun deleteAssignment(@AuthenticationPrincipal authentication: Jwt, @PathVariable assignmentId: UUID) =
        vacancyService.deleteAssignment(authentication, assignmentId)
}
