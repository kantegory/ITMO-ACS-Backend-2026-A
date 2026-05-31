package ru.itmo.pxdkxvan.lab1.interaction.dto

import jakarta.validation.constraints.NotBlank

data class ApplicationStatusUpdateRequest(
    @field:NotBlank
    val status: String,
)
