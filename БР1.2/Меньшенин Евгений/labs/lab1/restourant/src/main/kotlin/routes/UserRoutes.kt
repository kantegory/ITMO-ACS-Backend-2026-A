package com.mezhendosina.routes

import com.mezhendosina.auth.hashPassword
import com.mezhendosina.database.*
import com.mezhendosina.database.Users
import io.ktor.http.*
import io.ktor.server.auth.*
import io.ktor.server.auth.jwt.*
import io.ktor.server.request.*
import io.ktor.server.response.*
import io.ktor.server.routing.*
import org.jetbrains.exposed.sql.SqlExpressionBuilder.eq
import org.jetbrains.exposed.sql.deleteWhere
import org.jetbrains.exposed.sql.insert
import org.jetbrains.exposed.sql.select
import org.jetbrains.exposed.sql.selectAll
import org.jetbrains.exposed.sql.transactions.transaction
import org.jetbrains.exposed.sql.update
import java.time.LocalDateTime

fun Route.userRoutes() {
    route("/users") {
        post("/register") {
            val request = call.receive<RegisterRequest>()

            val existing = transaction {
                Users.select(Users.id).where { Users.email eq request.email }.singleOrNull()
            }

            if (existing != null) {
                call.respond(HttpStatusCode.Conflict, ErrorResponse("User with this email already exists"))
                return@post
            }

            val hashedPassword = hashPassword(request.password)
            val role = request.role ?: "client"

            val id = transaction {
                Users.insert {
                    it[email] = request.email
                    it[firstName] = request.firstName
                    it[lastName] = request.lastName
                    it[phoneNumber] = request.phoneNumber
                    it[Users.role] = role
                    it[password] = hashedPassword
                    it[createdAt] = LocalDateTime.now().toString()
                    it[updatedAt] = LocalDateTime.now().toString()
                } get Users.id
            }

            call.respond(
                HttpStatusCode.Created,
                UserResponse(
                    id = id.value,
                    email = request.email,
                    firstName = request.firstName,
                    lastName = request.lastName,
                    phoneNumber = request.phoneNumber,
                    role = role,
                )
            )
        }

        authenticate("auth-jwt") {
            get {
                val page = call.request.queryParameters["page"]?.toIntOrNull() ?: 1
                val limit = call.request.queryParameters["limit"]?.toIntOrNull() ?: 50

                val users = transaction {
                    Users.select(
                        Users.id, Users.email, Users.firstName,
                        Users.lastName, Users.phoneNumber, Users.role,
                    )
                        .limit(limit)
                        .offset(((page - 1) * limit).toLong())
                        .map { row ->
                            UserResponse(
                                id = row[Users.id].value,
                                email = row[Users.email],
                                firstName = row[Users.firstName],
                                lastName = row[Users.lastName],
                                phoneNumber = row[Users.phoneNumber],
                                role = row[Users.role],
                            )
                        }
                }
                call.respond(users)
            }

            get("/me") {
                val userId = call.principalUserId()!!
                val user = transaction {
                    Users.select(
                        Users.id, Users.email, Users.firstName,
                        Users.lastName, Users.phoneNumber, Users.role,
                    ).where { Users.id eq userId }.map { row ->
                        UserResponse(
                            id = row[Users.id].value,
                            email = row[Users.email],
                            firstName = row[Users.firstName],
                            lastName = row[Users.lastName],
                            phoneNumber = row[Users.phoneNumber],
                            role = row[Users.role],
                        )
                    }.singleOrNull()
                }

                if (user == null) {
                    call.respond(HttpStatusCode.NotFound, ErrorResponse("User not found"))
                    return@get
                }

                call.respond(user)
            }

            get("/{id}") {
                val id = call.parameters["id"]?.toIntOrNull() ?: run {
                    call.respond(HttpStatusCode.BadRequest, ErrorResponse("Invalid id"))
                    return@get
                }

                val user = transaction {
                    Users.select(
                        Users.id, Users.email, Users.firstName,
                        Users.lastName, Users.phoneNumber, Users.role,
                    ).where { Users.id eq id }.map { row ->
                        UserResponse(
                            id = row[Users.id].value,
                            email = row[Users.email],
                            firstName = row[Users.firstName],
                            lastName = row[Users.lastName],
                            phoneNumber = row[Users.phoneNumber],
                            role = row[Users.role],
                        )
                    }.singleOrNull()
                }

                if (user == null) {
                    call.respond(HttpStatusCode.NotFound, ErrorResponse("User not found"))
                    return@get
                }

                call.respond(user)
            }

            delete("/{id}") {
                val currentUserId = call.principalUserId()!!
                val currentUserRole = call.principalUserRole() ?: ""

                val id = call.parameters["id"]?.toIntOrNull() ?: run {
                    call.respond(HttpStatusCode.BadRequest, ErrorResponse("Invalid id"))
                    return@delete
                }

                if (currentUserId != id && currentUserRole != "admin") {
                    call.respond(HttpStatusCode.Forbidden, ErrorResponse("Access denied"))
                    return@delete
                }

                val deleted = transaction {
                    Users.deleteWhere { Users.id eq id }
                }

                if (deleted == 0) {
                    call.respond(HttpStatusCode.NotFound, ErrorResponse("User not found"))
                    return@delete
                }

                call.respond(HttpStatusCode.NoContent)
            }

            patch("/{id}") {
                val currentUserId = call.principalUserId()!!
                val currentUserRole = call.principalUserRole() ?: ""

                val id = call.parameters["id"]?.toIntOrNull() ?: run {
                    call.respond(HttpStatusCode.BadRequest, ErrorResponse("Invalid id"))
                    return@patch
                }

                if (currentUserId != id && currentUserRole != "admin") {
                    call.respond(HttpStatusCode.Forbidden, ErrorResponse("Access denied"))
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

                val user = transaction {
                    Users.select(
                        Users.id, Users.email, Users.firstName,
                        Users.lastName, Users.phoneNumber, Users.role,
                    ).where { Users.id eq id }.map { row ->
                        UserResponse(
                            id = row[Users.id].value,
                            email = row[Users.email],
                            firstName = row[Users.firstName],
                            lastName = row[Users.lastName],
                            phoneNumber = row[Users.phoneNumber],
                            role = row[Users.role],
                        )
                    }.singleOrNull()
                }

                call.respond(user ?: ErrorResponse("User not found"))
            }
        }
    }
}
