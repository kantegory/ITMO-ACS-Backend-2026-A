package ru.itmo.pxdkxvan.lab23.application.dto

import java.time.OffsetDateTime
import java.util.UUID

data class ApplicationResponse(
    val id: UUID,
    val vacancyId: UUID,
    val resumeId: UUID,
    val applicantUserId: UUID,
    val status: String,
    val coverLetter: String?,
    val createdAt: OffsetDateTime,
    val statusChangedAt: OffsetDateTime,
)
