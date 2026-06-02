package com.restaurant.feedback

import com.restaurant.shared.auth.ServiceEnv
import com.restaurant.shared.http.ServiceHttpClient
import com.restaurant.shared.http.ServiceResult
import com.restaurant.shared.models.BatchUsersRequest
import com.restaurant.shared.models.BatchUsersResponse
import com.restaurant.shared.models.InternalRestaurantResponse
import com.restaurant.shared.models.InternalUserResponse
import com.restaurant.shared.models.UpdateRatingRequest
import io.ktor.client.request.setBody
import io.ktor.http.ContentType
import io.ktor.http.contentType

class ServiceClients {
    private val identityUrl = ServiceEnv.urlEnv("IDENTITY_SERVICE_URL", "http://localhost:8081")
    private val restaurantUrl = ServiceEnv.urlEnv("RESTAURANT_SERVICE_URL", "http://localhost:8082")
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

    suspend fun batchUsers(userIds: List<Int>, requestId: String?): BatchUsersResponse =
        when (val r = http.post<BatchUsersResponse>("$identityUrl/internal/users/batch", requestId) {
            contentType(ContentType.Application.Json)
            setBody(BatchUsersRequest(userIds))
        }) {
            is ServiceResult.Success -> r.value
            else -> BatchUsersResponse(emptyList())
        }

    suspend fun updateRestaurantRating(restaurantId: Int, rating: Double, count: Int, requestId: String?) {
        http.put<com.restaurant.shared.models.RatingResponse>(
            "$restaurantUrl/internal/restaurants/$restaurantId/rating",
            requestId,
        ) {
            contentType(ContentType.Application.Json)
            setBody(UpdateRatingRequest(rating, count))
        }
    }

    fun close() = http.close()
}
