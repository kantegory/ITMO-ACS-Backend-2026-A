package ru.itmo.pxdkxvan.lab23.company.controller

import io.swagger.v3.oas.annotations.security.SecurityRequirement
import org.springframework.security.oauth2.jwt.Jwt
import org.springframework.security.core.annotation.AuthenticationPrincipal
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PatchMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RestController
import ru.itmo.pxdkxvan.lab23.company.dto.CompanyRequest
import ru.itmo.pxdkxvan.lab23.company.dto.EmployerProfileRequest
import ru.itmo.pxdkxvan.lab23.company.service.CompanyService
import java.util.UUID

@RestController
class CompanyController(
    private val companyService: CompanyService,
) {
    @PostMapping("/companies")
    @SecurityRequirement(name = "bearerAuth")
    fun createCompany(@AuthenticationPrincipal authentication: Jwt, @RequestBody request: CompanyRequest) =
        companyService.createCompany(authentication, request)

    @GetMapping("/companies/{companyId}")
    fun getCompany(@PathVariable companyId: UUID) = companyService.getCompany(companyId)

    @PatchMapping("/companies/{companyId}")
    @SecurityRequirement(name = "bearerAuth")
    fun updateCompany(@AuthenticationPrincipal authentication: Jwt, @PathVariable companyId: UUID, @RequestBody request: CompanyRequest) =
        companyService.updateCompany(authentication, companyId, request)

    @PostMapping("/employer-profiles")
    @SecurityRequirement(name = "bearerAuth")
    fun createProfile(@AuthenticationPrincipal authentication: Jwt, @RequestBody request: EmployerProfileRequest) =
        companyService.createOrUpdateProfile(authentication, request)

    @GetMapping("/employer-profiles/me")
    @SecurityRequirement(name = "bearerAuth")
    fun myProfile(@AuthenticationPrincipal authentication: Jwt) = companyService.myProfile(authentication)
}
