package ru.itmo.pxdkxvan.lab23.interaction.dto

import java.util.UUID

data class VacancyPublicContext(
    val vacancyId: UUID,
    val exists: Boolean,
    val published: Boolean,
)
