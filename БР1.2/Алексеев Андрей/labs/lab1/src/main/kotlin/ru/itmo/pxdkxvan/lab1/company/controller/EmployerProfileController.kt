package ru.itmo.pxdkxvan.lab1.company.controller

import jakarta.validation.Valid
import org.springframework.http.HttpStatus
import org.springframework.security.core.annotation.AuthenticationPrincipal
import org.springframework.security.oauth2.jwt.Jwt
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PatchMapping
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.ResponseStatus
import org.springframework.web.bind.annotation.RestController
import ru.itmo.pxdkxvan.lab1.company.dto.EmployerProfileCreateRequest
import ru.itmo.pxdkxvan.lab1.company.dto.EmployerProfileResponse
import ru.itmo.pxdkxvan.lab1.company.dto.EmployerProfileUpdateRequest
import ru.itmo.pxdkxvan.lab1.company.service.CompanyService

@RestController
@RequestMapping("/employer-profiles")
class EmployerProfileController(
    private val companyService: CompanyService,
) {
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    fun create(
        @AuthenticationPrincipal jwt: Jwt,
        @Valid @RequestBody request: EmployerProfileCreateRequest,
    ): EmployerProfileResponse = companyService.createEmployerProfile(jwt, request)

    @GetMapping("/me")
    fun me(@AuthenticationPrincipal jwt: Jwt): EmployerProfileResponse = companyService.currentEmployerProfile(jwt)

    @PatchMapping("/me")
    fun update(
        @AuthenticationPrincipal jwt: Jwt,
        @Valid @RequestBody request: EmployerProfileUpdateRequest,
    ): EmployerProfileResponse = companyService.updateCurrentEmployerProfile(jwt, request)
}
