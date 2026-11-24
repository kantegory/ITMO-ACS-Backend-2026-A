package ru.itmo.pxdkxvan.lab23.application.dto

import java.time.OffsetDateTime
import java.util.UUID

data class ApplicationEvent(
    val eventType: String,
    val applicationId: UUID,
    val applicantUserId: UUID,
    val vacancyId: UUID,
    val vacancyTitle: String? = null,
    val status: String,
    val occurredAt: OffsetDateTime,
)
