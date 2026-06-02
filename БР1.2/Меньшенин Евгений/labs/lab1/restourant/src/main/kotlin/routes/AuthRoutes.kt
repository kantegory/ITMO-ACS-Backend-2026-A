package com.mezhendosina.routes

import com.mezhendosina.auth.JwtConfig
import com.mezhendosina.auth.checkPassword
import com.mezhendosina.database.ErrorResponse
import com.mezhendosina.database.LoginRequest
import com.mezhendosina.database.LoginResponse
import com.mezhendosina.database.Users
import io.ktor.http.*
import io.ktor.server.request.*
import io.ktor.server.response.*
import io.ktor.server.routing.*
import org.jetbrains.exposed.sql.select
import org.jetbrains.exposed.sql.transactions.transaction

fun Route.authRoutes() {
    route("/auth") {
        post("/login") {
            val loginRequest = call.receive<LoginRequest>()
            val user = transaction {
                Users.select(Users.id, Users.password)
                    .where { Users.email eq loginRequest.email }
                    .map { Pair(it[Users.id].value, it[Users.password]) }
                    .singleOrNull()
            }

            if (user == null) {
                call.respond(HttpStatusCode.BadRequest, ErrorResponse("User is not found"))
                return@post
            }

            if (!checkPassword(loginRequest.password, user.second)) {
                call.respond(HttpStatusCode.BadRequest, ErrorResponse("Password or email is incorrect"))
                return@post
            }

            val token = JwtConfig.generateToken(user.first)
            call.respond(LoginResponse(token))
        }
    }
}
