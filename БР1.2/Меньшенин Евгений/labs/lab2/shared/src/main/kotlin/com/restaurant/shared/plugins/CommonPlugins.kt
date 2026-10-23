package com.restaurant.shared.plugins

import com.restaurant.shared.auth.ServiceEnv
import com.restaurant.shared.models.ApiError
import com.restaurant.shared.models.LegacyErrorResponse
import io.ktor.http.HttpHeaders
import io.ktor.http.HttpStatusCode
import io.ktor.serialization.kotlinx.json.json
import io.ktor.server.application.Application
import io.ktor.server.application.ApplicationCall
import io.ktor.server.application.ApplicationCallPipeline
import io.ktor.server.application.call
import io.ktor.server.application.install
import io.ktor.server.plugins.contentnegotiation.ContentNegotiation
import io.ktor.server.plugins.cors.routing.CORS
import io.ktor.server.plugins.statuspages.StatusPages
import io.ktor.server.request.httpMethod
import io.ktor.server.request.path
import io.ktor.server.request.uri
import io.ktor.server.response.respond
import io.ktor.http.HttpMethod
import kotlinx.serialization.json.Json
import org.slf4j.MDC
import java.util.UUID

data class UserContext(val userId: Int, val role: String)

fun ApplicationCall.userContext(): UserContext? {
    val userId = request.headers["X-User-Id"]?.toIntOrNull() ?: return null
    val role = request.headers["X-User-Role"] ?: "client"
    return UserContext(userId, role)
}

fun ApplicationCall.requireUser(): UserContext? = userContext()

fun ApplicationCall.requestId(): String =
    request.headers["X-Request-Id"] ?: UUID.randomUUID().toString()

fun Application.configureCommonPlugins() {
    install(ContentNegotiation) {
        json(Json { prettyPrint = true; isLenient = true; ignoreUnknownKeys = true })
    }
    install(CORS) {
        anyHost()
        allowHeader(HttpHeaders.ContentType)
        allowHeader(HttpHeaders.Authorization)
        allowHeader("X-User-Id")
        allowHeader("X-User-Role")
        allowHeader("X-Request-Id")
        allowMethod(HttpMethod.Get)
        allowMethod(HttpMethod.Post)
        allowMethod(HttpMethod.Patch)
        allowMethod(HttpMethod.Put)
        allowMethod(HttpMethod.Delete)
        allowMethod(HttpMethod.Options)
    }
    install(StatusPages) {
        exception<Throwable> { call, cause ->
            call.respond(
                HttpStatusCode.InternalServerError,
                ApiError("INTERNAL_ERROR", cause.message ?: "Internal server error"),
            )
        }
    }
    intercept(ApplicationCallPipeline.Setup) {
        val requestId = call.requestId()
        MDC.put("requestId", requestId)
        call.response.headers.append("X-Request-Id", requestId)
        try {
            proceed()
        } finally {
            MDC.remove("requestId")
        }
    }
}

fun Application.configureInternalAuth() {
    intercept(ApplicationCallPipeline.Call) {
        if (!call.request.path().startsWith("/internal")) {
            proceed()
            return@intercept
        }
        val auth = call.request.headers[HttpHeaders.Authorization]
        val expected = "Bearer ${ServiceEnv.serviceToken}"
        if (auth != expected) {
            call.respond(
                HttpStatusCode.Unauthorized,
                ApiError("UNAUTHORIZED", "Service token is missing or invalid"),
            )
            finish()
            return@intercept
        }
        proceed()
    }
}

suspend fun ApplicationCall.respondLegacyOrApi(status: HttpStatusCode, message: String, code: String = "BAD_REQUEST") {
    if (request.path().startsWith("/internal")) {
        respond(status, ApiError(code, message))
    } else {
        respond(status, LegacyErrorResponse(message))
    }
}

suspend fun ApplicationCall.respondApi(status: HttpStatusCode, code: String, message: String) {
    respond(status, ApiError(code, message))
}
