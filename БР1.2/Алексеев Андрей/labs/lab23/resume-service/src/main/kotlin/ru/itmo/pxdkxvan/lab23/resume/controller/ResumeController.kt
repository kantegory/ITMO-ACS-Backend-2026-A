package ru.itmo.pxdkxvan.lab23.resume.controller

import io.swagger.v3.oas.annotations.security.SecurityRequirement
import org.springframework.security.oauth2.jwt.Jwt
import org.springframework.security.core.annotation.AuthenticationPrincipal
import org.springframework.web.bind.annotation.DeleteMapping
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PatchMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RestController
import ru.itmo.pxdkxvan.lab23.resume.dto.ResumeRequest
import ru.itmo.pxdkxvan.lab23.resume.service.ResumeService
import java.util.UUID

@RestController
@RequestMapping("/resumes")
@SecurityRequirement(name = "bearerAuth")
class ResumeController(
    private val resumeService: ResumeService,
) {
    @GetMapping
    fun list(
        @AuthenticationPrincipal authentication: Jwt,
        @RequestParam(defaultValue = "1") page: Int,
        @RequestParam(defaultValue = "20") limit: Int,
    ) = resumeService.list(authentication, page, limit)

    @PostMapping
    fun create(@AuthenticationPrincipal authentication: Jwt, @RequestBody request: ResumeRequest) = resumeService.create(authentication, request)

    @GetMapping("/{resumeId}")
    fun get(@AuthenticationPrincipal authentication: Jwt, @PathVariable resumeId: UUID) = resumeService.get(authentication, resumeId)

    @PatchMapping("/{resumeId}")
    fun update(@AuthenticationPrincipal authentication: Jwt, @PathVariable resumeId: UUID, @RequestBody request: ResumeRequest) =
        resumeService.update(authentication, resumeId, request)

    @DeleteMapping("/{resumeId}")
    fun delete(@AuthenticationPrincipal authentication: Jwt, @PathVariable resumeId: UUID) = resumeService.delete(authentication, resumeId)
}
