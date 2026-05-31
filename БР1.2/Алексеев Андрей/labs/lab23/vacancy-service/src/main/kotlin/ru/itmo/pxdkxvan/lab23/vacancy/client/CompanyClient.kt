package ru.itmo.pxdkxvan.lab23.vacancy.client

import org.springframework.cloud.openfeign.FeignClient
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.RequestHeader
import ru.itmo.pxdkxvan.lab23.vacancy.dto.CompanyResponse
import ru.itmo.pxdkxvan.lab23.vacancy.dto.EmployerProfileContext
import java.util.UUID

@FeignClient(name = "companyClient", url = "\${app.clients.company-url}")
interface CompanyClient {
    @GetMapping("/internal/employer-profiles/by-user/{userId}")
    fun profileByUser(
        @RequestHeader("X-Service-Token") serviceToken: String,
        @PathVariable userId: UUID,
    ): EmployerProfileContext

    @GetMapping("/companies/{companyId}")
    fun getCompany(@PathVariable companyId: UUID): CompanyResponse
}
