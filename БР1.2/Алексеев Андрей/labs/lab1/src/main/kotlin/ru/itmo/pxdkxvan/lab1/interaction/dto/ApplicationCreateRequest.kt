package ru.itmo.pxdkxvan.lab1.interaction.dto

import java.util.UUID

data class ApplicationCreateRequest(
    val resumeId: UUID,
    val coverLetter: String? = null,
)
