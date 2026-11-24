package ru.itmo.pxdkxvan.lab1.interaction.dto

import java.time.OffsetDateTime
import java.util.UUID

data class ApplicationResponse(
    val id: UUID,
    val resumeId: UUID,
    val vacancyId: UUID,
    val coverLetter: String?,
    val status: String,
    val createdAt: OffsetDateTime,
    val statusChangedAt: OffsetDateTime,
)
