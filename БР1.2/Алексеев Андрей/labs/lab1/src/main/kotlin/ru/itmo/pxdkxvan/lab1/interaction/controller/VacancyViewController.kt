package ru.itmo.pxdkxvan.lab1.interaction.controller

import org.springframework.http.HttpStatus
import org.springframework.security.core.annotation.AuthenticationPrincipal
import org.springframework.security.oauth2.jwt.Jwt
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.ResponseStatus
import org.springframework.web.bind.annotation.RestController
import ru.itmo.pxdkxvan.lab1.common.PageResponse
import ru.itmo.pxdkxvan.lab1.interaction.dto.VacancyViewResponse
import ru.itmo.pxdkxvan.lab1.interaction.service.InteractionService
import java.util.UUID

@RestController
@RequestMapping("/vacancies/history")
class VacancyViewController(
    private val interactionService: InteractionService,
) {
    @GetMapping
    fun list(
        @AuthenticationPrincipal jwt: Jwt,
        @RequestParam(defaultValue = "1") page: Int,
        @RequestParam(defaultValue = "20") limit: Int,
    ): PageResponse<VacancyViewResponse> = interactionService.myVacancyViews(jwt, page, limit)

    @PostMapping("/{vacancyId}")
    @ResponseStatus(HttpStatus.CREATED)
    fun create(@AuthenticationPrincipal jwt: Jwt, @PathVariable vacancyId: UUID): VacancyViewResponse =
        interactionService.createVacancyView(jwt, vacancyId)
}
