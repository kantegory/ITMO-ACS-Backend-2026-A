package ru.itmo.pxdkxvan.lab1.common

class ApiException(
    val status: org.springframework.http.HttpStatus,
    val error: ApiErrorCode,
    override val message: String,
    val details: List<ErrorDetail> = emptyList(),
) : RuntimeException(message)
