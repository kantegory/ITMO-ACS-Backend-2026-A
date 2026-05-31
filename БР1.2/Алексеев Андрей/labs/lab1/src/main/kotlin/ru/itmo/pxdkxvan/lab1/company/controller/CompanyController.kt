package ru.itmo.pxdkxvan.lab1.company.controller

import jakarta.validation.Valid
import org.springframework.http.HttpStatus
import org.springframework.security.core.annotation.AuthenticationPrincipal
import org.springframework.security.oauth2.jwt.Jwt
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PatchMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.ResponseStatus
import org.springframework.web.bind.annotation.RestController
import ru.itmo.pxdkxvan.lab1.company.dto.CompanyCreateRequest
import ru.itmo.pxdkxvan.lab1.company.dto.CompanyResponse
import ru.itmo.pxdkxvan.lab1.company.dto.CompanyUpdateRequest
import ru.itmo.pxdkxvan.lab1.company.service.CompanyService
import java.util.UUID

@RestController
@RequestMapping("/companies")
class CompanyController(
    private val companyService: CompanyService,
) {
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    fun create(@AuthenticationPrincipal jwt: Jwt, @Valid @RequestBody request: CompanyCreateRequest): CompanyResponse =
        companyService.createCompany(jwt, request)

    @GetMapping("/{companyId}")
    fun get(@PathVariable companyId: UUID): CompanyResponse = companyService.getCompany(companyId)

    @PatchMapping("/{companyId}")
    fun update(
        @AuthenticationPrincipal jwt: Jwt,
        @PathVariable companyId: UUID,
        @Valid @RequestBody request: CompanyUpdateRequest,
    ): CompanyResponse = companyService.updateCompany(jwt, companyId, request)
}
