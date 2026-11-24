package ru.itmo.pxdkxvan.lab23.vacancy.dto

import java.util.UUID

data class DictionaryResponse(
    val id: UUID,
    val code: String,
    val displayName: String,
)
