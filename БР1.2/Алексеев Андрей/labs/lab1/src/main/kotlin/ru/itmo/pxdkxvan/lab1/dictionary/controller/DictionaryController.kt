package ru.itmo.pxdkxvan.lab1.dictionary.controller

import jakarta.validation.Valid
import org.springframework.http.HttpStatus
import org.springframework.security.core.annotation.AuthenticationPrincipal
import org.springframework.security.oauth2.jwt.Jwt
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PatchMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.ResponseStatus
import org.springframework.web.bind.annotation.RestController
import ru.itmo.pxdkxvan.lab1.common.ItemsResponse
import ru.itmo.pxdkxvan.lab1.dictionary.dto.DictionaryCreateRequest
import ru.itmo.pxdkxvan.lab1.dictionary.dto.DictionaryResponse
import ru.itmo.pxdkxvan.lab1.dictionary.dto.DictionaryUpdateRequest
import ru.itmo.pxdkxvan.lab1.dictionary.dto.SkillCreateRequest
import ru.itmo.pxdkxvan.lab1.dictionary.dto.SkillResponse
import ru.itmo.pxdkxvan.lab1.dictionary.dto.SkillUpdateRequest
import ru.itmo.pxdkxvan.lab1.dictionary.service.DictionaryService
import java.util.UUID

@RestController
class DictionaryController(
    private val dictionaryService: DictionaryService,
) {
    @GetMapping("/industries")
    fun industries(): ItemsResponse<DictionaryResponse> = dictionaryService.industries()

    @PostMapping("/industries")
    @ResponseStatus(HttpStatus.CREATED)
    fun createIndustry(
        @AuthenticationPrincipal jwt: Jwt,
        @Valid @RequestBody request: DictionaryCreateRequest,
    ): DictionaryResponse = dictionaryService.createIndustry(jwt, request)

    @PatchMapping("/industries/{industryId}")
    fun updateIndustry(
        @AuthenticationPrincipal jwt: Jwt,
        @PathVariable industryId: UUID,
        @Valid @RequestBody request: DictionaryUpdateRequest,
    ): DictionaryResponse = dictionaryService.updateIndustry(jwt, industryId, request)

    @GetMapping("/experience-levels")
    fun experienceLevels(): ItemsResponse<DictionaryResponse> = dictionaryService.experienceLevels()

    @PostMapping("/experience-levels")
    @ResponseStatus(HttpStatus.CREATED)
    fun createExperienceLevel(
        @AuthenticationPrincipal jwt: Jwt,
        @Valid @RequestBody request: DictionaryCreateRequest,
    ): DictionaryResponse = dictionaryService.createExperienceLevel(jwt, request)

    @PatchMapping("/experience-levels/{experienceLevelId}")
    fun updateExperienceLevel(
        @AuthenticationPrincipal jwt: Jwt,
        @PathVariable experienceLevelId: UUID,
        @Valid @RequestBody request: DictionaryUpdateRequest,
    ): DictionaryResponse = dictionaryService.updateExperienceLevel(jwt, experienceLevelId, request)

    @GetMapping("/skills")
    fun skills(): ItemsResponse<SkillResponse> = dictionaryService.skills()

    @PostMapping("/skills")
    @ResponseStatus(HttpStatus.CREATED)
    fun createSkill(
        @AuthenticationPrincipal jwt: Jwt,
        @Valid @RequestBody request: SkillCreateRequest,
    ): SkillResponse = dictionaryService.createSkill(jwt, request)

    @PatchMapping("/skills/{skillId}")
    fun updateSkill(
        @AuthenticationPrincipal jwt: Jwt,
        @PathVariable skillId: UUID,
        @Valid @RequestBody request: SkillUpdateRequest,
    ): SkillResponse = dictionaryService.updateSkill(jwt, skillId, request)
}
