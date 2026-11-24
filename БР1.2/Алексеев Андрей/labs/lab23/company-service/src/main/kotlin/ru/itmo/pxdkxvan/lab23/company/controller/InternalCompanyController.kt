package ru.itmo.pxdkxvan.lab23.company.controller

import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.RequestHeader
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController
import ru.itmo.pxdkxvan.lab23.company.config.CompanyProperties
import ru.itmo.pxdkxvan.lab23.company.service.CompanyService
import java.util.UUID

@RestController
@RequestMapping("/internal/employer-profiles")
class InternalCompanyController(
    private val companyService: CompanyService,
    private val companyProperties: CompanyProperties,
) {
    @GetMapping("/by-user/{userId}")
    fun byUser(
        @RequestHeader("X-Service-Token") serviceToken: String,
        @PathVariable userId: UUID,
    ) = companyService.profileByUser(serviceToken, companyProperties.security.serviceToken, userId)
}
