package ru.itmo.pxdkxvan.lab1.vacancy.dto

import jakarta.validation.constraints.NotBlank

data class OrderedTextItemRequest(
    @field:NotBlank
    val value: String,
    val sortOrder: Int? = null,
)
