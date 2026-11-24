package ru.itmo.pxdkxvan.lab23.user.dto

import java.util.UUID

data class NotificationContextResponse(
    val userId: UUID,
    val email: String,
    val firstName: String,
)
