package ru.itmo.pxdkxvan.lab1.company.dto

import java.time.OffsetDateTime
import java.util.UUID

data class EmployerProfileResponse(
    val id: UUID,
    val userId: UUID,
    val companyId: UUID,
    val position: String,
    val createdAt: OffsetDateTime,
    val updatedAt: OffsetDateTime,
)
