package ru.itmo.pxdkxvan.lab23.resume.controller

import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.RequestHeader
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RestController
import ru.itmo.pxdkxvan.lab23.resume.config.ResumeProperties
import ru.itmo.pxdkxvan.lab23.resume.service.ResumeService
import java.util.UUID

@RestController
@RequestMapping("/internal/resumes")
class InternalResumeController(
    private val resumeService: ResumeService,
    private val resumeProperties: ResumeProperties,
) {
    @GetMapping("/{resumeId}/ownership")
    fun ownership(
        @RequestHeader("X-Service-Token") serviceToken: String,
        @PathVariable resumeId: UUID,
        @RequestParam userId: UUID,
    ) = resumeService.ownership(serviceToken, resumeProperties.security.serviceToken, resumeId, userId)
}
