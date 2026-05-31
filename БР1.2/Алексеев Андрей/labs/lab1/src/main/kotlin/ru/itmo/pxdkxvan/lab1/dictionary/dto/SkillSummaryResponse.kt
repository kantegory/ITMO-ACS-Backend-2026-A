package ru.itmo.pxdkxvan.lab1.dictionary.dto

import java.util.UUID

data class SkillSummaryResponse(
    val id: UUID,
    val code: String,
    val displayName: String,
    val description: String?,
)
