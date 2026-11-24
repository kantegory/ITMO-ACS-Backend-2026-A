package ru.itmo.pxdkxvan.lab23.vacancy.controller

import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.RequestHeader
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController
import ru.itmo.pxdkxvan.lab23.vacancy.service.VacancyService
import java.util.UUID

@RestController
@RequestMapping("/internal/vacancies")
class InternalVacancyController(
    private val vacancyService: VacancyService,
) {
    @GetMapping("/{vacancyId}/application-context")
    fun applicationContext(
        @RequestHeader("X-Service-Token") serviceToken: String,
        @PathVariable vacancyId: UUID,
    ) = vacancyService.applicationContext(serviceToken, vacancyId)

    @GetMapping("/{vacancyId}/public-context")
    fun publicContext(
        @RequestHeader("X-Service-Token") serviceToken: String,
        @PathVariable vacancyId: UUID,
    ) = vacancyService.publicContext(serviceToken, vacancyId)
}
