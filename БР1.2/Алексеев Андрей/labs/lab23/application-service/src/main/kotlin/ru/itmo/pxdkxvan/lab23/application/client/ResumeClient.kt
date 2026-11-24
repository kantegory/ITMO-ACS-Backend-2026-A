package ru.itmo.pxdkxvan.lab23.application.client

import org.springframework.cloud.openfeign.FeignClient
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.RequestHeader
import org.springframework.web.bind.annotation.RequestParam
import ru.itmo.pxdkxvan.lab23.application.dto.ResumeOwnershipResponse
import java.util.UUID

@FeignClient(name = "resumeAppClient", url = "\${app.clients.resume-url}")
interface ResumeClient {
    @GetMapping("/internal/resumes/{resumeId}/ownership")
    fun ownership(
        @RequestHeader("X-Service-Token") serviceToken: String,
        @PathVariable resumeId: UUID,
        @RequestParam userId: UUID,
    ): ResumeOwnershipResponse
}
