package ru.itmo.pxdkxvan.lab23.company.dto

data class CompanyRequest(
    val title: String,
    val description: String?,
    val website: String?,
    val industryHint: String?,
    val address: String?,
    val employeeCount: Long?,
)
