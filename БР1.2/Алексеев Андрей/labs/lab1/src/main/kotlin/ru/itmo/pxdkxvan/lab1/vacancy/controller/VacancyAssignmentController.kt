package ru.itmo.pxdkxvan.lab1.vacancy.controller

import jakarta.validation.Valid
import org.springframework.http.HttpStatus
import org.springframework.security.core.annotation.AuthenticationPrincipal
import org.springframework.security.oauth2.jwt.Jwt
import org.springframework.web.bind.annotation.DeleteMapping
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PatchMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.ResponseStatus
import org.springframework.web.bind.annotation.RestController
import ru.itmo.pxdkxvan.lab1.common.ItemsResponse
import ru.itmo.pxdkxvan.lab1.vacancy.dto.VacancyAssignmentCreateRequest
import ru.itmo.pxdkxvan.lab1.vacancy.dto.VacancyAssignmentResponse
import ru.itmo.pxdkxvan.lab1.vacancy.dto.VacancyAssignmentUpdateRequest
import ru.itmo.pxdkxvan.lab1.vacancy.service.VacancyAssignmentService
import java.util.UUID

@RestController
class VacancyAssignmentController(
    private val vacancyAssignmentService: VacancyAssignmentService,
) {
    @GetMapping("/vacancies/{vacancyId}/assignments")
    fun list(
        @AuthenticationPrincipal jwt: Jwt,
        @PathVariable vacancyId: UUID,
    ): ItemsResponse<VacancyAssignmentResponse> = vacancyAssignmentService.list(jwt, vacancyId)

    @PostMapping("/vacancies/{vacancyId}/assignments")
    @ResponseStatus(HttpStatus.CREATED)
    fun create(
        @AuthenticationPrincipal jwt: Jwt,
        @PathVariable vacancyId: UUID,
        @Valid @RequestBody request: VacancyAssignmentCreateRequest,
    ): VacancyAssignmentResponse = vacancyAssignmentService.create(jwt, vacancyId, request)

    @PatchMapping("/vacancy-assignments/{assignmentId}")
    fun update(
        @AuthenticationPrincipal jwt: Jwt,
        @PathVariable assignmentId: UUID,
        @Valid @RequestBody request: VacancyAssignmentUpdateRequest,
    ): VacancyAssignmentResponse = vacancyAssignmentService.update(jwt, assignmentId, request)

    @DeleteMapping("/vacancy-assignments/{assignmentId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    fun delete(@AuthenticationPrincipal jwt: Jwt, @PathVariable assignmentId: UUID) =
        vacancyAssignmentService.delete(jwt, assignmentId)
}
