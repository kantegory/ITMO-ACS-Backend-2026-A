package ru.itmo.pxdkxvan.lab1.common

import org.springframework.http.HttpStatus

data class ErrorDetail(
    val field: String,
    val message: String,
)
