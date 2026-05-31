package ru.itmo.pxdkxvan.lab1.common

import com.fasterxml.jackson.annotation.JsonValue

enum class ApiErrorCode(@get:JsonValue val value: String) {
    VALIDATION("validation_error"),
    UNAUTHORIZED("unauthorized"),
    FORBIDDEN("forbidden"),
    NOT_FOUND("not_found"),
    CONFLICT("conflict"),
    INTERNAL("internal_error"),
}
