package ru.itmo.pxdkxvan.lab23.notification.dto

import java.time.OffsetDateTime
import java.util.UUID

data class ApplicationEvent(
    val eventType: String,
    val applicationId: UUID,
    val applicantUserId: UUID,
    val vacancyId: UUID,
    val vacancyTitle: String?,
    val status: String,
    val occurredAt: OffsetDateTime,
)
