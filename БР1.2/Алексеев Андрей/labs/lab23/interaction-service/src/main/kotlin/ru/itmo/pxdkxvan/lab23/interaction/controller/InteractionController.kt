package ru.itmo.pxdkxvan.lab23.interaction.controller

import io.swagger.v3.oas.annotations.security.SecurityRequirement
import org.springframework.security.oauth2.jwt.Jwt
import org.springframework.security.core.annotation.AuthenticationPrincipal
import org.springframework.web.bind.annotation.DeleteMapping
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RestController
import ru.itmo.pxdkxvan.lab23.interaction.service.InteractionService
import java.util.UUID

@RestController
@RequestMapping("/vacancies")
@SecurityRequirement(name = "bearerAuth")
class InteractionController(
    private val interactionService: InteractionService,
) {
    @GetMapping("/favorites")
    fun favorites(
        @AuthenticationPrincipal authentication: Jwt,
        @RequestParam(defaultValue = "1") page: Int,
        @RequestParam(defaultValue = "20") limit: Int,
    ) = interactionService.myFavorites(authentication, page, limit)

    @PostMapping("/favorites/{vacancyId}")
    fun addFavorite(@AuthenticationPrincipal authentication: Jwt, @PathVariable vacancyId: UUID) =
        interactionService.addFavorite(authentication, vacancyId)

    @DeleteMapping("/favorites/{vacancyId}")
    fun removeFavorite(@AuthenticationPrincipal authentication: Jwt, @PathVariable vacancyId: UUID) =
        interactionService.removeFavorite(authentication, vacancyId)

    @GetMapping("/history")
    fun views(
        @AuthenticationPrincipal authentication: Jwt,
        @RequestParam(defaultValue = "1") page: Int,
        @RequestParam(defaultValue = "20") limit: Int,
    ) = interactionService.myViews(authentication, page, limit)

    @PostMapping("/history/{vacancyId}")
    fun addView(@AuthenticationPrincipal authentication: Jwt, @PathVariable vacancyId: UUID) = interactionService.addView(authentication, vacancyId)
}
