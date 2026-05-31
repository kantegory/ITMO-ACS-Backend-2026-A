package ru.itmo.pxdkxvan.lab23.company.dto

import java.util.UUID

data class CompanyResponse(
    val id: UUID,
    val title: String,
    val description: String?,
    val website: String?,
    val industryHint: String?,
    val address: String?,
    val employeeCount: Long?,
)
