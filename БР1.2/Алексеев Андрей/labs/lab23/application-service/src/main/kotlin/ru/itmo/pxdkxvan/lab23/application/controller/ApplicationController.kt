package ru.itmo.pxdkxvan.lab23.application.controller

import io.swagger.v3.oas.annotations.security.SecurityRequirement
import org.springframework.security.oauth2.jwt.Jwt
import org.springframework.security.core.annotation.AuthenticationPrincipal
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PatchMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RestController
import ru.itmo.pxdkxvan.lab23.application.dto.ApplicationCreateRequest
import ru.itmo.pxdkxvan.lab23.application.dto.ApplicationStatusRequest
import ru.itmo.pxdkxvan.lab23.application.dto.InterviewInvitationRequest
import ru.itmo.pxdkxvan.lab23.application.service.ApplicationService
import java.util.UUID

@RestController
@SecurityRequirement(name = "bearerAuth")
class ApplicationController(
    private val service: ApplicationService,
) {
    @PostMapping("/vacancies/{vacancyId}/applications")
    fun create(@AuthenticationPrincipal authentication: Jwt, @PathVariable vacancyId: UUID, @RequestBody request: ApplicationCreateRequest) =
        service.create(authentication, vacancyId, request)

    @GetMapping("/vacancies/{vacancyId}/applications")
    fun vacancy(
        @AuthenticationPrincipal authentication: Jwt,
        @PathVariable vacancyId: UUID,
        @RequestParam(defaultValue = "1") page: Int,
        @RequestParam(defaultValue = "20") limit: Int,
    ) = service.vacancy(authentication, vacancyId, page, limit)

    @GetMapping("/applications/my")
    fun my(
        @AuthenticationPrincipal authentication: Jwt,
        @RequestParam(defaultValue = "1") page: Int,
        @RequestParam(defaultValue = "20") limit: Int,
    ) = service.my(authentication, page, limit)

    @PatchMapping("/applications/{applicationId}/status")
    fun updateStatus(@AuthenticationPrincipal authentication: Jwt, @PathVariable applicationId: UUID, @RequestBody request: ApplicationStatusRequest) =
        service.updateStatus(authentication, applicationId, request)

    @PostMapping("/applications/{applicationId}/interview-invitations")
    fun invite(@AuthenticationPrincipal authentication: Jwt, @PathVariable applicationId: UUID, @RequestBody request: InterviewInvitationRequest) =
        service.invite(authentication, applicationId, request)
}
