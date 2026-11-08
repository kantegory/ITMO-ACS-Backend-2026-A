package com.restaurant.booking

import com.restaurant.shared.auth.ServiceEnv
import com.restaurant.shared.http.ServiceHttpClient
import com.restaurant.shared.http.ServiceResult
import com.restaurant.shared.models.ApiError
import com.restaurant.shared.models.AvailabilityCheckRequest
import com.restaurant.shared.models.AvailabilityCheckResponse
import com.restaurant.shared.models.InternalRestaurantResponse
import com.restaurant.shared.models.InternalTableResponse
import com.restaurant.shared.models.InternalUserResponse
import com.restaurant.shared.models.ReleaseSlotRequest
import com.restaurant.shared.models.ReserveSlotRequest
import com.restaurant.shared.models.ReserveSlotResponse
import io.ktor.client.request.setBody
import io.ktor.http.ContentType
import io.ktor.http.HttpStatusCode
import io.ktor.http.contentType

class ServiceClients {
    private val identityUrl = ServiceEnv.urlEnv("IDENTITY_SERVICE_URL", "http://localhost:8081")
    private val restaurantUrl = ServiceEnv.urlEnv("RESTAURANT_SERVICE_URL", "http://localhost:8082")
    private val availabilityUrl = ServiceEnv.urlEnv("AVAILABILITY_SERVICE_URL", "http://localhost:8083")
    private val http = ServiceHttpClient(ServiceEnv.serviceToken)

    suspend fun getUser(userId: Int, requestId: String?): InternalUserResponse? =
        when (val r = http.get<InternalUserResponse>("$identityUrl/internal/users/$userId", requestId)) {
            is ServiceResult.Success -> r.value
            else -> null
        }

    suspend fun getRestaurant(restaurantId: Int, requestId: String?): InternalRestaurantResponse? =
        when (val r = http.get<InternalRestaurantResponse>("$restaurantUrl/internal/restaurants/$restaurantId", requestId)) {
            is ServiceResult.Success -> r.value
            else -> null
        }

    suspend fun getTable(tableId: Int, requestId: String?): InternalTableResponse? =
        when (val r = http.get<InternalTableResponse>("$availabilityUrl/internal/tables/$tableId", requestId)) {
            is ServiceResult.Success -> r.value
            else -> null
        }

    suspend fun checkAvailability(request: AvailabilityCheckRequest, requestId: String?): Pair<Boolean, ApiError?> =
        when (val r = http.post<AvailabilityCheckResponse>("$availabilityUrl/internal/availability/check", requestId) {
            contentType(ContentType.Application.Json)
            setBody(request)
        }) {
            is ServiceResult.Success -> r.value.available to null
            is ServiceResult.Failure -> false to (r.error ?: ApiError("SERVICE_UNAVAILABLE", r.raw))
            is ServiceResult.Error -> false to ApiError("SERVICE_UNAVAILABLE", "Dependency service is unavailable")
        }

    suspend fun reserve(request: ReserveSlotRequest, requestId: String?): Boolean =
        when (http.post<ReserveSlotResponse>("$availabilityUrl/internal/availability/reserve", requestId) {
            contentType(ContentType.Application.Json)
            setBody(request)
        }) {
            is ServiceResult.Success -> true
            else -> false
        }

    suspend fun release(bookingId: Int, requestId: String?): Boolean =
        when (http.post<com.restaurant.shared.models.ReleaseSlotResponse>(
            "$availabilityUrl/internal/availability/release",
            requestId,
        ) {
            contentType(ContentType.Application.Json)
            setBody(ReleaseSlotRequest(bookingId))
        }) {
            is ServiceResult.Success -> true
            else -> false
        }

    fun close() = http.close()
}
