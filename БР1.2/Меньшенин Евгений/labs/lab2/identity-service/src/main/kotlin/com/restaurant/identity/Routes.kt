package com.restaurant.identity

import com.restaurant.shared.auth.JwtConfig
import com.restaurant.shared.auth.checkPassword
import com.restaurant.shared.auth.hashPassword
import com.restaurant.shared.models.BatchUsersRequest
import com.restaurant.shared.models.BatchUsersResponse
import com.restaurant.shared.models.InternalUserResponse
import com.restaurant.shared.models.LegacyErrorResponse
import com.restaurant.shared.models.LoginRequest
import com.restaurant.shared.models.LoginResponse
import com.restaurant.shared.models.RegisterRequest
import com.restaurant.shared.models.UpdateUserRequest
import com.restaurant.shared.models.UserResponse
import com.restaurant.shared.plugins.requireUser
import com.restaurant.shared.plugins.respondLegacyOrApi
import com.restaurant.shared.plugins.userContext
import io.ktor.http.HttpStatusCode
import io.ktor.server.request.receive
import io.ktor.server.response.respond
import io.ktor.server.routing.Route
import io.ktor.server.routing.delete
import io.ktor.server.routing.get
import io.ktor.server.routing.patch
import io.ktor.server.routing.post
import io.ktor.server.routing.route
import org.jetbrains.exposed.sql.SqlExpressionBuilder.eq
import org.jetbrains.exposed.sql.deleteWhere
import org.jetbrains.exposed.sql.insert
import org.jetbrains.exposed.sql.select
import org.jetbrains.exposed.sql.transactions.transaction
import org.jetbrains.exposed.sql.update
import java.time.LocalDateTime

fun Route.publicRoutes() {
    route("/api/auth") {
        post("/login") {
            val loginRequest = call.receive<LoginRequest>()
            val user = transaction {
                Users.select(Users.id, Users.passwordHash, Users.role, Users.active)
                    .where { Users.email eq loginRequest.email }
                    .singleOrNull()
            }
            if (user == null || !user[Users.active]) {
                call.respond(HttpStatusCode.BadRequest, LegacyErrorResponse("User is not found"))
                return@post
            }
            if (!checkPassword(loginRequest.password, user[Users.passwordHash])) {
                call.respond(HttpStatusCode.BadRequest, LegacyErrorResponse("Password or email is incorrect"))
                return@post
            }
            call.respond(LoginResponse(JwtConfig.generateToken(user[Users.id].value, user[Users.role])))
        }
    }

    route("/api/users") {
        post("/register") {
            val request = call.receive<RegisterRequest>()
            val existing = transaction {
                Users.select(Users.id).where { Users.email eq request.email }.singleOrNull()
            }
            if (existing != null) {
                call.respond(HttpStatusCode.Conflict, LegacyErrorResponse("User with this email already exists"))
                return@post
            }
            val role = request.role ?: "client"
            val id = transaction {
                Users.insert {
                    it[email] = request.email
                    it[firstName] = request.firstName
                    it[lastName] = request.lastName
                    it[phoneNumber] = request.phoneNumber
                    it[Users.role] = role
                    it[passwordHash] = hashPassword(request.password)
                    it[active] = true
                    it[createdAt] = LocalDateTime.now().toString()
                    it[updatedAt] = LocalDateTime.now().toString()
                } get Users.id
            }
            call.respond(
                HttpStatusCode.Created,
                UserResponse(id.value, request.email, request.firstName, request.lastName, request.phoneNumber, role),
            )
        }

        get {
            val user = call.requireUser() ?: run {
                call.respond(HttpStatusCode.Unauthorized, LegacyErrorResponse("Unauthorized"))
                return@get
            }
            if (user.role != "admin") {
                call.respond(HttpStatusCode.Forbidden, LegacyErrorResponse("Access denied"))
                return@get
            }
            val page = call.request.queryParameters["page"]?.toIntOrNull() ?: 1
            val limit = call.request.queryParameters["limit"]?.toIntOrNull() ?: 50
            val users = transaction {
                Users.select(Users.id, Users.email, Users.firstName, Users.lastName, Users.phoneNumber, Users.role)
                    .limit(limit)
                    .offset(((page - 1) * limit).toLong())
                    .map { row -> row.toUserResponse() }
            }
            call.respond(users)
        }

        get("/me") {
            val userId = call.requireUser()?.userId ?: run {
                call.respond(HttpStatusCode.Unauthorized, LegacyErrorResponse("Unauthorized"))
                return@get
            }
            val u = findUserById(userId)
            if (u == null) {
                call.respond(HttpStatusCode.NotFound, LegacyErrorResponse("User not found"))
                return@get
            }
            call.respond(u)
        }

        get("/{id}") {
            val id = call.parameters["id"]?.toIntOrNull() ?: run {
                call.respond(HttpStatusCode.BadRequest, LegacyErrorResponse("Invalid id"))
                return@get
            }
            val u = findUserById(id)
            if (u == null) {
                call.respond(HttpStatusCode.NotFound, LegacyErrorResponse("User not found"))
                return@get
            }
            call.respond(u)
        }

        delete("/{id}") {
            val current = call.requireUser() ?: run {
                call.respond(HttpStatusCode.Unauthorized, LegacyErrorResponse("Unauthorized"))
                return@delete
            }
            val id = call.parameters["id"]?.toIntOrNull() ?: run {
                call.respond(HttpStatusCode.BadRequest, LegacyErrorResponse("Invalid id"))
                return@delete
            }
            if (current.userId != id && current.role != "admin") {
                call.respond(HttpStatusCode.Forbidden, LegacyErrorResponse("Access denied"))
                return@delete
            }
            val deleted = transaction { Users.deleteWhere { Users.id eq id } }
            if (deleted == 0) {
                call.respond(HttpStatusCode.NotFound, LegacyErrorResponse("User not found"))
                return@delete
            }
            call.respond(HttpStatusCode.NoContent)
        }

        patch("/{id}") {
            val current = call.requireUser() ?: run {
                call.respond(HttpStatusCode.Unauthorized, LegacyErrorResponse("Unauthorized"))
                return@patch
            }
            val id = call.parameters["id"]?.toIntOrNull() ?: run {
                call.respond(HttpStatusCode.BadRequest, LegacyErrorResponse("Invalid id"))
                return@patch
            }
            if (current.userId != id && current.role != "admin") {
                call.respond(HttpStatusCode.Forbidden, LegacyErrorResponse("Access denied"))
                return@patch
            }
            val request = call.receive<UpdateUserRequest>()
            transaction {
                Users.update({ Users.id eq id }) {
                    request.firstName?.let { v -> it[firstName] = v }
                    request.lastName?.let { v -> it[lastName] = v }
                    request.phoneNumber?.let { v -> it[phoneNumber] = v }
                    it[updatedAt] = LocalDateTime.now().toString()
                }
            }
            val u = findUserById(id)
            call.respond(u ?: LegacyErrorResponse("User not found"))
        }
    }
}

fun Route.internalRoutes() {
    route("/internal/users") {
        get("/{userId}") {
            val userId = call.parameters["userId"]?.toIntOrNull() ?: run {
                call.respond(HttpStatusCode.BadRequest, com.restaurant.shared.models.ApiError("BAD_REQUEST", "Invalid user id"))
                return@get
            }
            val user = findInternalUser(userId)
            if (user == null) {
                call.respond(HttpStatusCode.NotFound, com.restaurant.shared.models.ApiError("USER_NOT_FOUND", "User was not found"))
                return@get
            }
            call.respond(user)
        }
        post("/batch") {
            val request = call.receive<BatchUsersRequest>()
            val users = transaction {
                request.userIds.mapNotNull { findInternalUser(it) }
            }
            call.respond(BatchUsersResponse(users))
        }
    }
}

private fun org.jetbrains.exposed.sql.ResultRow.toUserResponse() = UserResponse(
    id = this[Users.id].value,
    email = this[Users.email],
    firstName = this[Users.firstName],
    lastName = this[Users.lastName],
    phoneNumber = this[Users.phoneNumber],
    role = this[Users.role],
)

private fun findUserById(id: Int): UserResponse? = transaction {
    Users.select(Users.id, Users.email, Users.firstName, Users.lastName, Users.phoneNumber, Users.role)
        .where { Users.id eq id }
        .map { it.toUserResponse() }
        .singleOrNull()
}

private fun findInternalUser(id: Int): InternalUserResponse? = transaction {
    Users.select(Users.id, Users.email, Users.firstName, Users.lastName, Users.role, Users.active)
        .where { Users.id eq id }
        .map {
            InternalUserResponse(
                id = it[Users.id].value,
                email = it[Users.email],
                firstName = it[Users.firstName],
                lastName = it[Users.lastName],
                fullName = "${it[Users.firstName]} ${it[Users.lastName]}",
                role = it[Users.role],
                active = it[Users.active],
            )
        }
        .singleOrNull()
}
