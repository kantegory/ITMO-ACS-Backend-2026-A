package com.restaurant.availability

import com.restaurant.shared.auth.ServiceEnv
import com.restaurant.shared.http.ServiceHttpClient
import com.restaurant.shared.http.ServiceResult
import com.restaurant.shared.models.InternalRestaurantResponse
import com.restaurant.shared.models.OwnershipResponse
import io.ktor.http.HttpStatusCode

class RestaurantClient {
    private val baseUrl = ServiceEnv.urlEnv("RESTAURANT_SERVICE_URL", "http://localhost:8082")
    private val client = ServiceHttpClient(ServiceEnv.serviceToken)

    suspend fun getRestaurant(id: Int, requestId: String?): InternalRestaurantResponse? =
        when (val result = client.get<InternalRestaurantResponse>("$baseUrl/internal/restaurants/$id", requestId)) {
            is ServiceResult.Success -> result.value
            else -> null
        }

    suspend fun checkOwnership(restaurantId: Int, ownerId: Int, requestId: String?): Boolean =
        when (val result = client.get<OwnershipResponse>(
            "$baseUrl/internal/restaurants/$restaurantId/ownership?ownerId=$ownerId",
            requestId,
        )) {
            is ServiceResult.Success -> result.value.isOwner
            else -> false
        }

    fun close() = client.close()
}
