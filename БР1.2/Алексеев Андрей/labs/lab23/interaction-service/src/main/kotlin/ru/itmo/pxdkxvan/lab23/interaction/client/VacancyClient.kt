package ru.itmo.pxdkxvan.lab23.interaction.client

import org.springframework.cloud.openfeign.FeignClient
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.RequestHeader
import ru.itmo.pxdkxvan.lab23.interaction.dto.VacancyPublicContext
import java.util.UUID

@FeignClient(name = "vacancyInteractionClient", url = $$"${app.clients.vacancy-url}")
interface VacancyClient {
    @GetMapping("/internal/vacancies/{vacancyId}/public-context")
    fun publicContext(
        @RequestHeader("X-Service-Token") serviceToken: String,
        @PathVariable vacancyId: UUID,
    ): VacancyPublicContext
}
