package ru.itmo.pxdkxvan.lab23.vacancy.dto

import java.util.UUID

data class CompanyResponse(
    val id: UUID? = null,
    val title: String? = null,
)
