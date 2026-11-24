package ru.itmo.pxdkxvan.lab23.vacancy.dto

import java.util.UUID

data class VacancyApplicationContext(
    val vacancyId: UUID,
    val companyId: UUID,
    val status: String,
    val acceptsApplications: Boolean,
    val assignedEmployerUserIds: List<UUID>,
)
