package ru.itmo.pxdkxvan.lab23.user.dto

data class UserUpdateRequest(
    val firstName: String?,
    val lastName: String?,
    val middleName: String?,
    val email: String?,
    val phone: String?,
)
