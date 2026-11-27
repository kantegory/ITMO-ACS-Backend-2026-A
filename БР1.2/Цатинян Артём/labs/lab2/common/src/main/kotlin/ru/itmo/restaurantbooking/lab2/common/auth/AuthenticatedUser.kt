package ru.itmo.restaurantbooking.lab2.common.auth

data class AuthenticatedUser(
    val id: Long,
    val email: String,
    val firstName: String,
    val lastName: String,
    val role: String,
    val active: Boolean
) {
    val fullName: String
        get() = "$firstName $lastName"
}
