package com.mezhendosina

import com.mezhendosina.auth.JwtConfig
import com.mezhendosina.database.DatabaseFactory
import com.mezhendosina.routes.authRoutes
import com.mezhendosina.routes.bookingRoutes
import com.mezhendosina.routes.menuRoutes
import com.mezhendosina.routes.restaurantRoutes
import com.mezhendosina.routes.reviewRoutes
import com.mezhendosina.routes.tableRoutes
import com.mezhendosina.routes.userRoutes
import io.ktor.http.HttpHeaders
import io.ktor.http.HttpMethod
import io.ktor.http.HttpStatusCode
import io.ktor.serialization.kotlinx.json.json
import io.ktor.server.application.Application
import io.ktor.server.application.install
import io.ktor.server.auth.Authentication
import io.ktor.server.auth.jwt.jwt
import io.ktor.server.plugins.contentnegotiation.ContentNegotiation
import io.ktor.server.plugins.cors.routing.CORS
import io.ktor.server.plugins.statuspages.StatusPages
import io.ktor.server.plugins.swagger.swaggerUI
import io.ktor.server.response.respond
import io.ktor.server.response.respondText
import io.ktor.server.routing.get
import io.ktor.server.routing.route
import io.ktor.server.routing.routing
import kotlinx.serialization.json.Json

fun Application.configureSerialization() {
    install(ContentNegotiation) {
        json(Json {
            prettyPrint = true
            isLenient = true
            ignoreUnknownKeys = true
        })
    }
}

fun Application.configureSecurity() {
    install(Authentication) {
        jwt("auth-jwt") {
            realm = JwtConfig.REALM
            verifier(JwtConfig.verifier)
            validate { credential ->
                val userId = credential.payload.getClaim("userId")?.asInt()
                if (userId != null) {
                    com.mezhendosina.routes.UserPrincipal(userId, "")
                } else {
                    null
                }
            }
            challenge { _, _ ->
                call.respond(HttpStatusCode.Unauthorized, mapOf("message" to "Token is invalid or expired"))
            }
        }
    }
}

fun Application.configureCORS() {
    install(CORS) {
        anyHost()
        allowHeader(HttpHeaders.ContentType)
        allowHeader(HttpHeaders.Authorization)
        allowMethod(HttpMethod.Get)
        allowMethod(HttpMethod.Post)
        allowMethod(HttpMethod.Patch)
        allowMethod(HttpMethod.Delete)
        allowMethod(HttpMethod.Options)
    }
}

fun Application.configureStatusPages() {
    install(StatusPages) {
        exception<Throwable> { call, cause ->
            call.respond(HttpStatusCode.InternalServerError, mapOf("message" to (cause.message ?: "Internal server error")))
        }
    }
}

fun Application.configureRouting() {
    DatabaseFactory.init()

    routing {
        swaggerUI(path = "swagger", swaggerFile = "openapi/documentation.yaml")
        get("/") {
            call.respondText("Restaurant Booking API")
        }
        route("/api") {
            authRoutes()
            userRoutes()
            restaurantRoutes()
            tableRoutes()
            bookingRoutes()
            menuRoutes()
            reviewRoutes()
        }
    }
}
