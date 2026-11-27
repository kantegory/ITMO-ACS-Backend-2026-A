package ru.itmo.restaurantbooking.lab2.identity.adapter.jooq

import org.jooq.DSLContext
import org.springframework.stereotype.Repository
import ru.itmo.restaurantbooking.lab2.common.exception.NotFoundException
import ru.itmo.restaurantbooking.lab2.identity.adapter.rest.dto.RegisterRequest
import ru.itmo.restaurantbooking.lab2.identity.adapter.rest.dto.UpdateProfileRequest
import ru.itmo.restaurantbooking.lab2.identity.domain.UserRecord
import ru.itmo.restaurantbooking.lab2.identity.jooq.tables.Users.USERS
import ru.itmo.restaurantbooking.lab2.identity.jooq.tables.records.UsersRecord

@Repository
class UserRepository(
    private val dsl: DSLContext
) {
    fun existsByEmail(email: String): Boolean =
        dsl.fetchExists(
            dsl.selectOne()
                .from(USERS)
                .where(USERS.EMAIL.eq(email.lowercase()))
        )

    fun findByEmail(email: String): UserRecord? =
        dsl.selectFrom(USERS)
            .where(USERS.EMAIL.eq(email.lowercase()))
            .and(USERS.IS_ACTIVE.eq(true))
            .fetchOne { it.toUserRecord() }

    fun findById(id: Long): UserRecord? =
        dsl.selectFrom(USERS)
            .where(USERS.ID.eq(id))
            .and(USERS.IS_ACTIVE.eq(true))
            .fetchOne { it.toUserRecord() }

    fun create(request: RegisterRequest, passwordHash: String): UserRecord {
        val id = dsl.insertInto(USERS)
            .set(USERS.EMAIL, request.email.lowercase())
            .set(USERS.PASSWORD_HASH, passwordHash)
            .set(USERS.FIRST_NAME, request.firstName)
            .set(USERS.LAST_NAME, request.lastName)
            .set(USERS.PHONE, request.phone)
            .set(USERS.ROLE, "CUSTOMER")
            .set(USERS.IS_ACTIVE, true)
            .set(USERS.CREATED_AT, java.time.LocalDateTime.now())
            .set(USERS.UPDATED_AT, java.time.LocalDateTime.now())
            .returningResult(USERS.ID)
            .fetchOne(USERS.ID)
            ?: error("Failed to create user")

        return findById(id) ?: error("Created user not found")
    }

    fun update(id: Long, request: UpdateProfileRequest): UserRecord {
        val current = findById(id) ?: throw NotFoundException("User not found")

        dsl.update(USERS)
            .set(USERS.FIRST_NAME, request.firstName ?: current.firstName)
            .set(USERS.LAST_NAME, request.lastName ?: current.lastName)
            .set(USERS.PHONE, request.phone ?: current.phone)
            .set(USERS.UPDATED_AT, java.time.LocalDateTime.now())
            .where(USERS.ID.eq(id))
            .execute()

        return findById(id) ?: throw NotFoundException("User not found")
    }
}

private fun UsersRecord.toUserRecord() =
    UserRecord(
        id = id,
        email = email,
        passwordHash = passwordHash,
        firstName = firstName,
        lastName = lastName,
        phone = phone,
        role = role,
        active = isActive,
        createdAt = createdAt
    )
