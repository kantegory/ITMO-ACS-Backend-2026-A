package ru.itmo.pxdkxvan.lab23.application.client

import org.springframework.cloud.openfeign.FeignClient
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.RequestHeader
import ru.itmo.pxdkxvan.lab23.application.dto.VacancyApplicationContext
import java.util.UUID

@FeignClient(name = "vacancyAppClient", url = "\${app.clients.vacancy-url}")
interface VacancyClient {
    @GetMapping("/internal/vacancies/{vacancyId}/application-context")
    fun applicationContext(
        @RequestHeader("X-Service-Token") serviceToken: String,
        @PathVariable vacancyId: UUID,
    ): VacancyApplicationContext
}
