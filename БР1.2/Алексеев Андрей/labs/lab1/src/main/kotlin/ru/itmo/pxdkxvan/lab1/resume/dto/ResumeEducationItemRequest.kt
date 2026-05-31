package ru.itmo.pxdkxvan.lab1.resume.dto

import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.Size
import java.time.LocalDate

data class ResumeEducationItemRequest(
    @field:NotBlank
    @field:Size(max = 255)
    val institutionName: String,
    @field:NotBlank
    @field:Size(max = 150)
    val degree: String,
    @field:Size(max = 255)
    val specialization: String? = null,
    val startDate: LocalDate,
    val endDate: LocalDate? = null,
    val isCurrent: Boolean = false,
    val description: String? = null,
)
