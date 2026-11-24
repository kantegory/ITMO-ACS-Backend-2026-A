package ru.itmo.pxdkxvan.lab23.application.dto

import java.time.OffsetDateTime

data class InterviewInvitationRequest(
    val scheduledAt: OffsetDateTime,
    val format: String,
    val notes: String?,
)
