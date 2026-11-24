package ru.itmo.pxdkxvan.lab1.vacancy.dto

import jakarta.validation.constraints.DecimalMin
import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.Size
import java.math.BigDecimal
import java.util.UUID

data class VacancyCreateRequest(
    val companyId: UUID,
    val industryId: UUID,
    val experienceLevelId: UUID,
    @field:NotBlank
    @field:Size(max = 255)
    val title: String,
    @field:NotBlank
    val description: String,
    @field:DecimalMin("0.0")
    val salaryFrom: BigDecimal? = null,
    @field:DecimalMin("0.0")
    val salaryTo: BigDecimal? = null,
    @field:NotBlank
    @field:Size(max = 255)
    val city: String,
    @field:NotBlank
    val employmentType: String,
    @field:NotBlank
    val workFormat: String,
    @field:NotBlank
    val status: String,
    val skillIds: List<UUID> = emptyList(),
    val requirements: List<OrderedTextItemRequest> = emptyList(),
    val responsibilities: List<OrderedTextItemRequest> = emptyList(),
    val benefits: List<OrderedTextItemRequest> = emptyList(),
)
