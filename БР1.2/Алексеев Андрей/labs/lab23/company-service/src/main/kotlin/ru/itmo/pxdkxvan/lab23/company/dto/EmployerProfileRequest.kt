package ru.itmo.pxdkxvan.lab23.company.dto

import java.util.UUID

data class EmployerProfileRequest(
    val companyId: UUID,
    val position: String,
)
