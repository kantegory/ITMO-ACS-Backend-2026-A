package ru.itmo.pxdkxvan.lab1.vacancy.dto

import java.util.UUID

data class OrderedTextItemResponse(
    val id: UUID,
    val value: String,
    val sortOrder: Int,
)
