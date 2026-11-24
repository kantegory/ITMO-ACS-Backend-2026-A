package ru.itmo.pxdkxvan.lab23.application.dto

import java.time.OffsetDateTime
import java.util.UUID

data class InterviewInvitationResponse(
    val id: UUID,
    val applicationId: UUID,
    val scheduledAt: OffsetDateTime,
    val format: String,
    val notes: String?,
    val createdAt: OffsetDateTime,
)
