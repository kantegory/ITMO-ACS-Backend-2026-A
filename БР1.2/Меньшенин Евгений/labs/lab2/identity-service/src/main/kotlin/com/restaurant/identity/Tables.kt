package com.restaurant.identity

import org.jetbrains.exposed.dao.id.IntIdTable

object Users : IntIdTable("users") {
    val email = varchar("email", 300).uniqueIndex()
    val firstName = varchar("first_name", 300)
    val lastName = varchar("last_name", 300)
    val phoneNumber = varchar("phone_number", 20).nullable()
    val role = varchar("role", 50).default("client")
    val passwordHash = varchar("password_hash", 150)
    val active = bool("active").default(true)
    val createdAt = varchar("created_at", 30)
    val updatedAt = varchar("updated_at", 30)
}
