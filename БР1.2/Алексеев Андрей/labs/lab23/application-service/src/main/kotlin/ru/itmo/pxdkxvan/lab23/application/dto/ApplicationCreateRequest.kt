package ru.itmo.pxdkxvan.lab23.application.dto

import java.util.UUID

data class ApplicationCreateRequest(
    val resumeId: UUID,
    val coverLetter: String?,
)
