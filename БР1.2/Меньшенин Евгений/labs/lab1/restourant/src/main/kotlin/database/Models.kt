package com.mezhendosina.database

import kotlinx.serialization.Serializable
import java.math.BigDecimal

@Serializable
data class UserResponse(
    val id: Int,
    val email: String,
    val firstName: String,
    val lastName: String,
    val phoneNumber: String? = null,
    val role: String,
)

@Serializable
data class RegisterRequest(
    val email: String,
    val password: String,
    val firstName: String,
    val lastName: String,
    val phoneNumber: String? = null,
    val role: String? = null,
)

@Serializable
data class LoginRequest(
    val email: String,
    val password: String,
)

@Serializable
data class LoginResponse(
    val accessToken: String,
)

@Serializable
data class RestaurantResponse(
    val id: Int,
    val name: String,
    val description: String? = null,
    val address: String,
    val phoneNumber: String? = null,
    val cuisineType: String? = null,
    val openingTime: String? = null,
    val closingTime: String? = null,
    val rating: Double = 0.0,
    val imageUrl: String? = null,
    val ownerId: Int,
)

@Serializable
data class RestaurantDetailResponse(
    val id: Int,
    val name: String,
    val description: String? = null,
    val address: String,
    val phoneNumber: String? = null,
    val cuisineType: String? = null,
    val openingTime: String? = null,
    val closingTime: String? = null,
    val rating: Double = 0.0,
    val imageUrl: String? = null,
    val ownerId: Int,
    val menu: List<MenuItemResponse> = emptyList(),
    val reviews: List<ReviewWithUserResponse> = emptyList(),
)

@Serializable
data class CreateRestaurantRequest(
    val name: String,
    val description: String? = null,
    val address: String,
    val phoneNumber: String? = null,
    val cuisineType: String? = null,
    val openingTime: String? = null,
    val closingTime: String? = null,
    val imageUrl: String? = null,
)

@Serializable
data class UpdateRestaurantRequest(
    val name: String? = null,
    val description: String? = null,
    val address: String? = null,
    val phoneNumber: String? = null,
    val cuisineType: String? = null,
    val openingTime: String? = null,
    val closingTime: String? = null,
    val imageUrl: String? = null,
)

@Serializable
data class RestaurantsListResponse(
    val restaurants: List<RestaurantResponse>,
    val total: Int,
    val page: Int,
    val limit: Int,
)

@Serializable
data class TableResponse(
    val id: Int,
    val restaurantId: Int,
    val tableNumber: Int,
    val capacity: Int,
    val locationDescription: String? = null,
    val isAvailable: Boolean = true,
    val availableTimeSlots: List<String>? = null,
)

@Serializable
data class TablesListResponse(
    val tables: List<TableResponse>,
    val date: String? = null,
)

@Serializable
data class CreateTableRequest(
    val restaurantId: Int,
    val tableNumber: Int,
    val capacity: Int,
    val locationDescription: String? = null,
)

@Serializable
data class UpdateTableRequest(
    val tableNumber: Int? = null,
    val capacity: Int? = null,
    val locationDescription: String? = null,
    val isAvailable: Boolean? = null,
)

@Serializable
data class BookingResponse(
    val id: Int,
    val userId: Int,
    val tableId: Int,
    val bookingDate: String,
    val startTime: String,
    val endTime: String,
    val numberOfGuests: Int,
    val specialRequests: String? = null,
    val status: String,
    val restaurantId: Int? = null,
    val restaurantName: String? = null,
)

@Serializable
data class BookingsListResponse(
    val bookings: List<BookingResponse>,
)

@Serializable
data class CreateBookingRequest(
    val tableId: Int,
    val bookingDate: String,
    val startTime: String,
    val endTime: String,
    val guests: Int,
    val specialRequests: String? = null,
)

@Serializable
data class UpdateBookingRequest(
    val tableId: Int? = null,
    val bookingDate: String? = null,
    val startTime: String? = null,
    val endTime: String? = null,
    val guests: Int? = null,
    val specialRequests: String? = null,
)

@Serializable
data class MenuItemResponse(
    val id: Int,
    val restaurantId: Int,
    val name: String,
    val description: String? = null,
    val price: Double,
    val category: String? = null,
    val isAvailable: Boolean = true,
)

@Serializable
data class CreateMenuItemRequest(
    val restaurantId: Int,
    val name: String,
    val description: String? = null,
    val price: Double,
    val category: String? = null,
    val isAvailable: Boolean? = null,
)

@Serializable
data class UpdateMenuItemRequest(
    val name: String? = null,
    val description: String? = null,
    val price: Double? = null,
    val category: String? = null,
    val isAvailable: Boolean? = null,
)

@Serializable
data class ReviewResponse(
    val id: Int,
    val userId: Int,
    val restaurantId: Int,
    val rating: Int,
    val comment: String? = null,
)

@Serializable
data class ReviewWithUserResponse(
    val id: Int,
    val userId: Int,
    val restaurantId: Int,
    val rating: Int,
    val comment: String? = null,
    val userName: String? = null,
)

@Serializable
data class ReviewsListResponse(
    val reviews: List<ReviewWithUserResponse>,
)

@Serializable
data class CreateReviewRequest(
    val restaurantId: Int,
    val rating: Int,
    val comment: String? = null,
)

@Serializable
data class UpdateReviewRequest(
    val rating: Int? = null,
    val comment: String? = null,
)

@Serializable
data class ErrorResponse(
    val message: String,
)

@Serializable
data class UpdateUserRequest(
    val firstName: String? = null,
    val lastName: String? = null,
    val phoneNumber: String? = null,
)
