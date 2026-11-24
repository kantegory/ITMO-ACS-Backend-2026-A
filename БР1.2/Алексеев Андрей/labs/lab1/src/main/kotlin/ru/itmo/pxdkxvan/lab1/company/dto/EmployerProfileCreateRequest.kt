package ru.itmo.pxdkxvan.lab1.company.dto

import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.Size
import java.util.UUID

data class EmployerProfileCreateRequest(
    val companyId: UUID,
    @field:NotBlank
    @field:Size(max = 255)
    val position: String,
)
