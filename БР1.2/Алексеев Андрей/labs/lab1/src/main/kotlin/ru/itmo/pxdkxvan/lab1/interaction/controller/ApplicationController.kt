package ru.itmo.pxdkxvan.lab1.interaction.controller

import jakarta.validation.Valid
import org.springframework.http.HttpStatus
import org.springframework.security.core.annotation.AuthenticationPrincipal
import org.springframework.security.oauth2.jwt.Jwt
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PatchMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.ResponseStatus
import org.springframework.web.bind.annotation.RestController
import ru.itmo.pxdkxvan.lab1.common.PageResponse
import ru.itmo.pxdkxvan.lab1.interaction.dto.ApplicationCreateRequest
import ru.itmo.pxdkxvan.lab1.interaction.dto.ApplicationResponse
import ru.itmo.pxdkxvan.lab1.interaction.dto.ApplicationStatusUpdateRequest
import ru.itmo.pxdkxvan.lab1.interaction.service.InteractionService
import java.util.UUID

@RestController
class ApplicationController(
    private val interactionService: InteractionService,
) {
    @PostMapping("/vacancies/{vacancyId}/applications")
    @ResponseStatus(HttpStatus.CREATED)
    fun create(
        @AuthenticationPrincipal jwt: Jwt,
        @PathVariable vacancyId: UUID,
        @Valid @RequestBody request: ApplicationCreateRequest,
    ): ApplicationResponse = interactionService.createApplication(jwt, vacancyId, request)

    @GetMapping("/vacancies/{vacancyId}/applications")
    fun listVacancyApplications(
        @AuthenticationPrincipal jwt: Jwt,
        @PathVariable vacancyId: UUID,
        @RequestParam(defaultValue = "1") page: Int,
        @RequestParam(defaultValue = "20") limit: Int,
    ): PageResponse<ApplicationResponse> = interactionService.vacancyApplications(jwt, vacancyId, page, limit)

    @GetMapping("/applications/my")
    fun myApplications(
        @AuthenticationPrincipal jwt: Jwt,
        @RequestParam(defaultValue = "1") page: Int,
        @RequestParam(defaultValue = "20") limit: Int,
    ): PageResponse<ApplicationResponse> = interactionService.myApplications(jwt, page, limit)

    @PatchMapping("/applications/{applicationId}/status")
    fun updateStatus(
        @AuthenticationPrincipal jwt: Jwt,
        @PathVariable applicationId: UUID,
        @Valid @RequestBody request: ApplicationStatusUpdateRequest,
    ): ApplicationResponse = interactionService.updateApplicationStatus(jwt, applicationId, request)
}
