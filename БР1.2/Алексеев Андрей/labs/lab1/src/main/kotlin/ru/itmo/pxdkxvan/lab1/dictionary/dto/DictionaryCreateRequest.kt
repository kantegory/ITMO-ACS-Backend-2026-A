package ru.itmo.pxdkxvan.lab1.dictionary.dto

import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.Size

data class DictionaryCreateRequest(
    @field:NotBlank
    @field:Size(max = 100)
    val code: String,
    @field:NotBlank
    @field:Size(max = 150)
    val displayName: String,
    @field:Size(max = 500)
    val description: String? = null,
    val isActive: Boolean = true,
)
