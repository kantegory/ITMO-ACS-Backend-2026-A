package ru.itmo.pxdkxvan.lab1.common

data class ErrorResponse(
    val error: ApiErrorCode,
    val message: String,
    val details: List<ErrorDetail> = emptyList(),
)
