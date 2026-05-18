package ru.itmo.pxdkxvan.lab1.vacancy.dto

import jakarta.validation.constraints.DecimalMin
import jakarta.validation.constraints.Size
import java.math.BigDecimal
import java.util.UUID

data class VacancyUpdateRequest(
    val vacancyAssignmentId: UUID? = null,
    val companyId: UUID? = null,
    val industryId: UUID? = null,
    val experienceLevelId: UUID? = null,
    @field:Size(max = 255)
    val title: String? = null,
    val description: String? = null,
    @field:DecimalMin("0.0")
    val salaryFrom: BigDecimal? = null,
    @field:DecimalMin("0.0")
    val salaryTo: BigDecimal? = null,
    @field:Size(max = 255)
    val city: String? = null,
    val employmentType: String? = null,
    val workFormat: String? = null,
    val status: String? = null,
    val skillIds: List<UUID>? = null,
    val requirements: List<OrderedTextItemRequest>? = null,
    val responsibilities: List<OrderedTextItemRequest>? = null,
    val benefits: List<OrderedTextItemRequest>? = null,
)
