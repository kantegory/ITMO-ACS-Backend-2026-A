package ru.itmo.pxdkxvan.lab1.company.dto

import java.math.BigDecimal
import java.time.OffsetDateTime
import java.util.UUID

data class CompanyResponse(
    val id: UUID,
    val title: String,
    val description: String?,
    val website: String?,
    val industryHint: String?,
    val address: String?,
    val employeeCount: BigDecimal?,
    val createdAt: OffsetDateTime,
    val updatedAt: OffsetDateTime,
)
