package ru.itmo.pxdkxvan.lab23.company.dto

import java.util.UUID

data class EmployerProfileResponse(
    val id: UUID,
    val userId: UUID,
    val companyId: UUID,
    val position: String,
)
