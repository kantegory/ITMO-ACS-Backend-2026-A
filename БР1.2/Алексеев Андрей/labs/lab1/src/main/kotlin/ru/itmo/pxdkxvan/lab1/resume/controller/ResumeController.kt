package ru.itmo.pxdkxvan.lab1.resume.controller

import jakarta.servlet.http.HttpServletRequest
import jakarta.validation.Valid
import org.springframework.http.HttpStatus
import org.springframework.security.core.annotation.AuthenticationPrincipal
import org.springframework.security.oauth2.jwt.Jwt
import org.springframework.web.bind.annotation.DeleteMapping
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PatchMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.ResponseStatus
import org.springframework.web.bind.annotation.RestController
import ru.itmo.pxdkxvan.lab1.common.PageResponse
import ru.itmo.pxdkxvan.lab1.common.extractBracketParameters
import ru.itmo.pxdkxvan.lab1.resume.dto.ResumeCreateRequest
import ru.itmo.pxdkxvan.lab1.resume.dto.ResumeResponse
import ru.itmo.pxdkxvan.lab1.resume.dto.ResumeUpdateRequest
import ru.itmo.pxdkxvan.lab1.resume.service.ResumeService
import java.util.UUID

@RestController
@RequestMapping("/resumes")
class ResumeController(
    private val resumeService: ResumeService,
) {
    @GetMapping
    fun list(
        @AuthenticationPrincipal jwt: Jwt,
        @RequestParam(defaultValue = "1") page: Int,
        @RequestParam(defaultValue = "20") limit: Int,
        request: HttpServletRequest,
    ): PageResponse<ResumeResponse> =
        resumeService.list(
            jwt = jwt,
            page = page,
            limit = limit,
            sort = LinkedHashMap(extractBracketParameters(request, "sort").mapValues { it.value.last() }),
        )

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    fun create(@AuthenticationPrincipal jwt: Jwt, @Valid @RequestBody request: ResumeCreateRequest): ResumeResponse =
        resumeService.create(jwt, request)

    @GetMapping("/{resumeId}")
    fun get(@AuthenticationPrincipal jwt: Jwt, @PathVariable resumeId: UUID): ResumeResponse = resumeService.get(jwt, resumeId)

    @PatchMapping("/{resumeId}")
    fun update(
        @AuthenticationPrincipal jwt: Jwt,
        @PathVariable resumeId: UUID,
        @Valid @RequestBody request: ResumeUpdateRequest,
    ): ResumeResponse = resumeService.update(jwt, resumeId, request)

    @DeleteMapping("/{resumeId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    fun delete(@AuthenticationPrincipal jwt: Jwt, @PathVariable resumeId: UUID) = resumeService.delete(jwt, resumeId)
}
