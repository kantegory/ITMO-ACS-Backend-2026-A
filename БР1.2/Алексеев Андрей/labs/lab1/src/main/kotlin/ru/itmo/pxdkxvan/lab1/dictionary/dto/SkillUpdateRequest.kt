package ru.itmo.pxdkxvan.lab1.dictionary.dto

import jakarta.validation.constraints.Size

data class SkillUpdateRequest(
    @field:Size(max = 100)
    val code: String? = null,
    @field:Size(max = 150)
    val displayName: String? = null,
    @field:Size(max = 500)
    val description: String? = null,
    val isActive: Boolean? = null,
)
