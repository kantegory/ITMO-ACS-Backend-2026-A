package com.restaurant.gateway

import com.restaurant.shared.auth.JwtConfig
import com.restaurant.shared.auth.ServiceEnv
import com.restaurant.shared.models.LegacyErrorResponse
import com.restaurant.shared.models.RestaurantDetailResponse
import com.restaurant.shared.models.ReviewsListResponse
import com.restaurant.shared.plugins.configureCommonPlugins
import com.restaurant.shared.plugins.requestId
import io.ktor.client.HttpClient
import io.ktor.client.call.body
import io.ktor.client.engine.cio.CIO
import io.ktor.client.plugins.contentnegotiation.ContentNegotiation
import io.ktor.client.request.header
import io.ktor.client.request.request
import io.ktor.client.request.setBody
import io.ktor.client.request.url
import io.ktor.client.statement.bodyAsText
import io.ktor.http.HttpHeaders
import io.ktor.http.HttpMethod
import io.ktor.http.HttpStatusCode
import io.ktor.serialization.kotlinx.json.json
import io.ktor.server.application.Application
import io.ktor.server.application.ApplicationCall
import io.ktor.server.application.call
import io.ktor.server.plugins.swagger.swaggerUI
import io.ktor.server.request.httpMethod
import io.ktor.server.request.receiveText
import io.ktor.server.request.uri
import io.ktor.server.response.respond
import io.ktor.server.response.respondText
import io.ktor.server.routing.get
import io.ktor.server.routing.route
import io.ktor.server.routing.routing
import io.ktor.http.ContentType
import kotlinx.serialization.json.Json

private fun ApplicationCall.apiPath(): String {
    val raw = request.uri.substringBefore('?')
    return when {
        raw.startsWith("/api") -> raw
        raw.startsWith("/") -> "/api$raw"
        else -> "/api/$raw"
    }
}

fun Application.module() {
    configureCommonPlugins()

    val identityUrl = ServiceEnv.urlEnv("IDENTITY_SERVICE_URL", "http://identity-service:8081")
    val restaurantUrl = ServiceEnv.urlEnv("RESTAURANT_SERVICE_URL", "http://restaurant-service:8082")
    val availabilityUrl = ServiceEnv.urlEnv("AVAILABILITY_SERVICE_URL", "http://availability-service:8083")
    val bookingUrl = ServiceEnv.urlEnv("BOOKING_SERVICE_URL", "http://booking-service:8084")
    val feedbackUrl = ServiceEnv.urlEnv("FEEDBACK_SERVICE_URL", "http://feedback-service:8085")

    val client = HttpClient(CIO) {
        install(ContentNegotiation) { json(Json { ignoreUnknownKeys = true }) }
    }

    routing {
        swaggerUI(path = "swagger", swaggerFile = "openapi/public-api.yaml")
        get("/") {
            call.respondText(
                "Restaurant Booking API Gateway\nSwagger UI: /swagger\nOpenAPI: /swagger/openapi/public-api.yaml",
            )
        }
        get("/health") { call.respondText("OK") }

        route("/api/{...}") {
            handle {
                val path = call.apiPath()
                when {
                    path.startsWith("/api/auth") -> {
                        proxy(client, identityUrl, call, requireAuth = false)
                    }
                    path.startsWith("/api/users/register") -> {
                        proxy(client, identityUrl, call, requireAuth = false)
                    }
                    path.startsWith("/api/users") -> {
                        if (!ensureAuth(call)) return@handle
                        proxy(client, identityUrl, call, requireAuth = true)
                    }
                    path.matches(Regex("/api/restaurants/\\d+")) && call.request.httpMethod == HttpMethod.Get -> {
                        aggregateRestaurant(client, restaurantUrl, feedbackUrl, call)
                    }
                    path.startsWith("/api/restaurants") || path.startsWith("/api/menu") -> {
                        val auth = call.request.httpMethod != HttpMethod.Get
                        if (auth && !ensureAuth(call)) return@handle
                        proxy(client, restaurantUrl, call, requireAuth = auth)
                    }
                    path.startsWith("/api/tables") -> {
                        val auth = call.request.httpMethod != HttpMethod.Get
                        if (auth && !ensureAuth(call)) return@handle
                        proxy(client, availabilityUrl, call, requireAuth = auth)
                    }
                    path.startsWith("/api/bookings") -> {
                        if (!ensureAuth(call)) return@handle
                        proxy(client, bookingUrl, call, requireAuth = true)
                    }
                    path.startsWith("/api/reviews") -> {
                        val auth = call.request.httpMethod != HttpMethod.Get
                        if (auth && !ensureAuth(call)) return@handle
                        proxy(client, feedbackUrl, call, requireAuth = auth)
                    }
                    else -> call.respond(HttpStatusCode.NotFound, LegacyErrorResponse("Not found"))
                }
            }
        }
    }
}

private suspend fun ensureAuth(call: ApplicationCall): Boolean {
    val token = call.request.headers[HttpHeaders.Authorization]?.removePrefix("Bearer ")?.trim()
    if (token == null || JwtConfig.userIdFromToken(token) == null) {
        call.respond(HttpStatusCode.Unauthorized, LegacyErrorResponse("Token is invalid or expired"))
        return false
    }
    return true
}

private suspend fun aggregateRestaurant(
    client: HttpClient,
    restaurantUrl: String,
    feedbackUrl: String,
    call: ApplicationCall,
) {
    val path = call.apiPath()
    val requestId = call.requestId()
    val restaurant = runCatching {
        client.request("$restaurantUrl$path") {
            method = HttpMethod.Get
            header("X-Request-Id", requestId)
        }.body<RestaurantDetailResponse>()
    }.getOrNull()
    if (restaurant == null) {
        call.respond(HttpStatusCode.NotFound, LegacyErrorResponse("Restaurant not found"))
        return
    }
    val restaurantId = restaurant.id
    val reviews = runCatching {
        client.request("$feedbackUrl/api/reviews/restaurant/$restaurantId") {
            method = HttpMethod.Get
            header("X-Request-Id", requestId)
        }.body<ReviewsListResponse>().reviews
    }.getOrElse { emptyList() }
    call.respond(restaurant.copy(reviews = reviews))
}

private suspend fun proxy(client: HttpClient, baseUrl: String, call: ApplicationCall, requireAuth: Boolean) {
    val token = call.request.headers[HttpHeaders.Authorization]?.removePrefix("Bearer ")?.trim()
    val userId = token?.let { JwtConfig.userIdFromToken(it) }
    val role = token?.let { JwtConfig.roleFromToken(it) }

    if (requireAuth && userId == null) {
        call.respond(HttpStatusCode.Unauthorized, LegacyErrorResponse("Token is invalid or expired"))
        return
    }

    val path = call.apiPath()
    val bodyText = when (call.request.httpMethod) {
        HttpMethod.Get, HttpMethod.Delete -> null
        else -> call.receiveText().takeIf { it.isNotBlank() }
    }

    val response = client.request {
        url("$baseUrl$path")
        call.request.queryParameters.forEach { name, values ->
            values.forEach { value -> url.parameters.append(name, value) }
        }
        method = call.request.httpMethod
        header("X-Request-Id", call.requestId())
        if (userId != null) {
            header("X-User-Id", userId.toString())
            header("X-User-Role", role ?: "client")
        }
        if (bodyText != null) {
            setBody(bodyText)
            header(HttpHeaders.ContentType, call.request.headers[HttpHeaders.ContentType] ?: "application/json")
        }
    }

    val responseBody = response.bodyAsText()
    val contentType = response.headers[HttpHeaders.ContentType]?.let { ContentType.parse(it) }
        ?: ContentType.Application.Json
    call.respondText(responseBody, contentType, response.status)
}
