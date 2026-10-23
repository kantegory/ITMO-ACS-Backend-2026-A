package com.restaurant.shared.http

import com.restaurant.shared.models.ApiError
import io.ktor.client.HttpClient
import io.ktor.client.call.body
import io.ktor.client.engine.cio.CIO
import io.ktor.client.plugins.HttpTimeout
import io.ktor.client.plugins.contentnegotiation.ContentNegotiation
import io.ktor.client.request.HttpRequestBuilder
import io.ktor.client.request.header
import io.ktor.client.request.request
import io.ktor.client.statement.HttpResponse
import io.ktor.client.statement.bodyAsText
import io.ktor.http.HttpHeaders
import io.ktor.http.HttpStatusCode
import io.ktor.serialization.kotlinx.json.json
import kotlinx.serialization.json.Json

class ServiceHttpClient(serviceToken: String) {
    private val token = serviceToken

    val client = HttpClient(CIO) {
        install(ContentNegotiation) {
            json(Json { ignoreUnknownKeys = true; isLenient = true })
        }
        install(HttpTimeout) {
            requestTimeoutMillis = 3_000
            connectTimeoutMillis = 3_000
            socketTimeoutMillis = 3_000
        }
    }

    fun HttpRequestBuilder.applyServiceHeaders(requestId: String?) {
        header(HttpHeaders.Authorization, "Bearer $token")
        requestId?.let { header("X-Request-Id", it) }
    }

    suspend inline fun <reified T> get(
        url: String,
        requestId: String? = null,
        crossinline block: HttpRequestBuilder.() -> Unit = {},
    ): ServiceResult<T> = execute(url, requestId) {
        method = io.ktor.http.HttpMethod.Get
        block()
    }

    suspend inline fun <reified T> post(
        url: String,
        requestId: String? = null,
        crossinline block: HttpRequestBuilder.() -> Unit = {},
    ): ServiceResult<T> = execute(url, requestId) {
        method = io.ktor.http.HttpMethod.Post
        block()
    }

    suspend inline fun <reified T> put(
        url: String,
        requestId: String? = null,
        crossinline block: HttpRequestBuilder.() -> Unit = {},
    ): ServiceResult<T> = execute(url, requestId) {
        method = io.ktor.http.HttpMethod.Put
        block()
    }

    suspend inline fun <reified T> execute(
        url: String,
        requestId: String?,
        crossinline configure: HttpRequestBuilder.() -> Unit,
    ): ServiceResult<T> {
        return try {
            val response: HttpResponse = client.request(url) {
                configure()
                applyServiceHeaders(requestId)
            }
            when (response.status) {
                HttpStatusCode.OK, HttpStatusCode.Created -> ServiceResult.Success(response.body())
                else -> {
                    val text = response.bodyAsText()
                    val error = runCatching { Json.decodeFromString<ApiError>(text) }.getOrNull()
                    ServiceResult.Failure(response.status, error, text)
                }
            }
        } catch (e: Exception) {
            ServiceResult.Error(e)
        }
    }

    fun close() = client.close()
}

sealed class ServiceResult<out T> {
    data class Success<T>(val value: T) : ServiceResult<T>()
    data class Failure(val status: HttpStatusCode, val error: ApiError?, val raw: String) : ServiceResult<Nothing>()
    data class Error(val exception: Exception) : ServiceResult<Nothing>()
}
