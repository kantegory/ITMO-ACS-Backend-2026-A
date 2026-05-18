package ru.itmo.pxdkxvan.lab1.dictionary.dto

import java.time.OffsetDateTime
import java.util.UUID

data class DictionaryResponse(
    val id: UUID,
    val code: String,
    val displayName: String,
    val description: String?,
    val isActive: Boolean,
    val createdAt: OffsetDateTime,
    val updatedAt: OffsetDateTime,
)
