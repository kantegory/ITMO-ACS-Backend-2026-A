package ru.itmo.pxdkxvan.lab1.interaction.dto

import java.time.OffsetDateTime
import java.util.UUID

data class FavoriteVacancyResponse(
    val id: UUID,
    val userId: UUID,
    val vacancyId: UUID,
    val createdAt: OffsetDateTime,
)
