package ru.itmo.pxdkxvan.lab23.notification.dto

import java.time.OffsetDateTime
import java.util.UUID

data class NotificationResponse(
    val id: UUID,
    val userId: UUID,
    val type: String,
    val title: String,
    val body: String,
    val createdAt: OffsetDateTime,
    val readAt: OffsetDateTime?,
)
