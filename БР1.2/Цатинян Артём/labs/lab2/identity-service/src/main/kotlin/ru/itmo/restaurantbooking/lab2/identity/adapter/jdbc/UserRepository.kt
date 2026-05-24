package ru.itmo.restaurantbooking.lab2.identity.adapter.jdbc

import org.springframework.jdbc.core.namedparam.MapSqlParameterSource
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate
import org.springframework.stereotype.Repository
import ru.itmo.restaurantbooking.lab2.common.exception.NotFoundException
import ru.itmo.restaurantbooking.lab2.identity.adapter.rest.dto.RegisterRequest
import ru.itmo.restaurantbooking.lab2.identity.adapter.rest.dto.UpdateProfileRequest
import ru.itmo.restaurantbooking.lab2.identity.domain.UserRecord
import java.sql.ResultSet

@Repository
class UserRepository(
    private val jdbc: NamedParameterJdbcTemplate
) {
    fun existsByEmail(email: String): Boolean =
        jdbc.queryForObject(
            "select exists(select 1 from users where email = :email)",
            mapOf("email" to email.lowercase()),
            Boolean::class.java
        ) ?: false

    fun findByEmail(email: String): UserRecord? =
        jdbc.query(
            "select * from users where email = :email and is_active = true",
            mapOf("email" to email.lowercase())
        ) { rs, _ -> rs.toUserRecord() }.firstOrNull()

    fun findById(id: Long): UserRecord? =
        jdbc.query(
            "select * from users where id = :id and is_active = true",
            mapOf("id" to id)
        ) { rs, _ -> rs.toUserRecord() }.firstOrNull()

    fun create(request: RegisterRequest, passwordHash: String): UserRecord {
        val id = jdbc.queryForObject(
            """
            insert into users(email, password_hash, first_name, last_name, phone, role, is_active, created_at, updated_at)
            values (:email, :passwordHash, :firstName, :lastName, :phone, 'CUSTOMER', true, now(), now())
            returning id
            """.trimIndent(),
            MapSqlParameterSource()
                .addValue("email", request.email.lowercase())
                .addValue("passwordHash", passwordHash)
                .addValue("firstName", request.firstName)
                .addValue("lastName", request.lastName)
                .addValue("phone", request.phone),
            Long::class.java
        ) ?: error("Failed to create user")

        return findById(id) ?: error("Created user not found")
    }

    fun update(id: Long, request: UpdateProfileRequest): UserRecord {
        val current = findById(id) ?: throw NotFoundException("User not found")

        jdbc.update(
            """
            update users
            set first_name = :firstName,
                last_name = :lastName,
                phone = :phone,
                updated_at = now()
            where id = :id
            """.trimIndent(),
            MapSqlParameterSource()
                .addValue("id", id)
                .addValue("firstName", request.firstName ?: current.firstName)
                .addValue("lastName", request.lastName ?: current.lastName)
                .addValue("phone", request.phone ?: current.phone)
        )

        return findById(id) ?: throw NotFoundException("User not found")
    }
}

private fun ResultSet.toUserRecord() =
    UserRecord(
        id = getLong("id"),
        email = getString("email"),
        passwordHash = getString("password_hash"),
        firstName = getString("first_name"),
        lastName = getString("last_name"),
        phone = getString("phone"),
        role = getString("role"),
        active = getBoolean("is_active"),
        createdAt = getTimestamp("created_at").toLocalDateTime()
    )
