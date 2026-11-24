package ru.itmo.pxdkxvan.lab1.company.dto

import jakarta.validation.constraints.Size
import java.util.UUID

data class EmployerProfileUpdateRequest(
    val companyId: UUID? = null,
    @field:Size(max = 255)
    val position: String? = null,
)
