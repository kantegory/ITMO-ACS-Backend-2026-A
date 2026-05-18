package com.restaurant.restaurant

import com.restaurant.shared.events.EventTypes
import com.restaurant.shared.events.restaurantDeletedPayload
import com.restaurant.shared.models.ApiError
import com.restaurant.shared.models.CreateMenuItemRequest
import com.restaurant.shared.models.CreateRestaurantRequest
import com.restaurant.shared.models.InternalRestaurantResponse
import com.restaurant.shared.models.LegacyErrorResponse
import com.restaurant.shared.models.MenuItemResponse
import com.restaurant.shared.models.OwnershipResponse
import com.restaurant.shared.models.RatingResponse
import com.restaurant.shared.models.RestaurantDetailResponse
import com.restaurant.shared.models.RestaurantResponse
import com.restaurant.shared.models.RestaurantsListResponse
import com.restaurant.shared.models.UpdateMenuItemRequest
import com.restaurant.shared.models.UpdateRatingRequest
import com.restaurant.shared.models.UpdateRestaurantRequest
import com.restaurant.shared.events.RedisEventBus
import com.restaurant.shared.plugins.requireUser
import io.ktor.http.HttpStatusCode
import io.ktor.server.request.receive
import io.ktor.server.response.respond
import io.ktor.server.routing.Route
import io.ktor.server.routing.delete
import io.ktor.server.routing.get
import io.ktor.server.routing.patch
import io.ktor.server.routing.post
import io.ktor.server.routing.put
import io.ktor.server.routing.route
import org.jetbrains.exposed.sql.Op
import org.jetbrains.exposed.sql.SqlExpressionBuilder.eq
import org.jetbrains.exposed.sql.SqlExpressionBuilder.greaterEq
import org.jetbrains.exposed.sql.SqlExpressionBuilder.like
import org.jetbrains.exposed.sql.and
import org.jetbrains.exposed.sql.deleteWhere
import org.jetbrains.exposed.sql.insert
import org.jetbrains.exposed.sql.select
import org.jetbrains.exposed.sql.transactions.transaction
import org.jetbrains.exposed.sql.update
import java.math.BigDecimal
import java.math.RoundingMode
import java.time.LocalDateTime

fun Route.restaurantPublicRoutes(eventBus: RedisEventBus?) {
    route("/api/restaurants") {
        get {
            val cuisine = call.request.queryParameters["cuisine"]
            val location = call.request.queryParameters["location"]
            val minRating = call.request.queryParameters["minRating"]?.toDoubleOrNull()
            val page = call.request.queryParameters["page"]?.toIntOrNull() ?: 1
            val limit = call.request.queryParameters["limit"]?.toIntOrNull() ?: 20
            val (list, total) = transaction {
                var condition: Op<Boolean> = Restaurants.active eq true
                if (cuisine != null) condition = condition and (Restaurants.cuisineType like "%$cuisine%")
                if (location != null) condition = condition and (Restaurants.address like "%$location%")
                if (minRating != null) condition = condition and (Restaurants.rating greaterEq BigDecimal(minRating))
                val query = Restaurants.select(
                    Restaurants.id, Restaurants.name, Restaurants.description, Restaurants.address,
                    Restaurants.phoneNumber, Restaurants.cuisineType, Restaurants.openingTime,
                    Restaurants.closingTime, Restaurants.rating, Restaurants.imageUrl, Restaurants.ownerId,
                ).where(condition)
                val totalCount = query.count().toInt()
                val paged = query.limit(limit).offset(((page - 1) * limit).toLong()).map { it.toRestaurantResponse() }
                paged to totalCount
            }
            call.respond(RestaurantsListResponse(list, total, page, limit))
        }

        get("/{id}") {
            val id = call.parameters["id"]?.toIntOrNull() ?: run {
                call.respond(HttpStatusCode.BadRequest, LegacyErrorResponse("Invalid id"))
                return@get
            }
            val result = transaction {
                val restaurantRow = Restaurants.select(
                    Restaurants.id, Restaurants.name, Restaurants.description, Restaurants.address,
                    Restaurants.phoneNumber, Restaurants.cuisineType, Restaurants.openingTime,
                    Restaurants.closingTime, Restaurants.rating, Restaurants.imageUrl, Restaurants.ownerId,
                ).where { (Restaurants.id eq id) and (Restaurants.active eq true) }.singleOrNull()
                    ?: return@transaction null
                val menu = MenuItems.select(
                    MenuItems.id, MenuItems.restaurantId, MenuItems.name, MenuItems.description,
                    MenuItems.price, MenuItems.category, MenuItems.isAvailable,
                ).where { MenuItems.restaurantId eq id }.map { it.toMenuItemResponse() }
                RestaurantDetailResponse(
                    id = restaurantRow[Restaurants.id].value,
                    name = restaurantRow[Restaurants.name],
                    description = restaurantRow[Restaurants.description],
                    address = restaurantRow[Restaurants.address],
                    phoneNumber = restaurantRow[Restaurants.phoneNumber],
                    cuisineType = restaurantRow[Restaurants.cuisineType],
                    openingTime = restaurantRow[Restaurants.openingTime],
                    closingTime = restaurantRow[Restaurants.closingTime],
                    rating = restaurantRow[Restaurants.rating].toDouble(),
                    imageUrl = restaurantRow[Restaurants.imageUrl],
                    ownerId = restaurantRow[Restaurants.ownerId],
                    menu = menu,
                    reviews = emptyList(),
                )
            }
            if (result == null) {
                call.respond(HttpStatusCode.NotFound, LegacyErrorResponse("Restaurant not found"))
                return@get
            }
            call.respond(result)
        }

        post {
            val user = call.requireUser() ?: run {
                call.respond(HttpStatusCode.Unauthorized, LegacyErrorResponse("Unauthorized"))
                return@post
            }
            val request = call.receive<CreateRestaurantRequest>()
            val id = transaction {
                Restaurants.insert {
                    it[name] = request.name
                    it[description] = request.description
                    it[address] = request.address
                    it[phoneNumber] = request.phoneNumber
                    it[cuisineType] = request.cuisineType
                    it[openingTime] = request.openingTime
                    it[closingTime] = request.closingTime
                    it[imageUrl] = request.imageUrl
                    it[ownerId] = user.userId
                    it[createdAt] = LocalDateTime.now().toString()
                    it[updatedAt] = LocalDateTime.now().toString()
                } get Restaurants.id
            }
            call.respond(HttpStatusCode.Created, RestaurantResponse(
                id.value, request.name, request.description, request.address, request.phoneNumber,
                request.cuisineType, request.openingTime, request.closingTime, 0.0, request.imageUrl, user.userId,
            ))
        }

        patch("/{id}") {
            val user = call.requireUser() ?: run {
                call.respond(HttpStatusCode.Unauthorized, LegacyErrorResponse("Unauthorized"))
                return@patch
            }
            val id = call.parameters["id"]?.toIntOrNull() ?: run {
                call.respond(HttpStatusCode.BadRequest, LegacyErrorResponse("Invalid id"))
                return@patch
            }
            val restaurant = transaction {
                Restaurants.select(Restaurants.id, Restaurants.ownerId, Restaurants.active)
                    .where { Restaurants.id eq id }.singleOrNull()
            }
            if (restaurant == null || !restaurant[Restaurants.active]) {
                call.respond(HttpStatusCode.NotFound, LegacyErrorResponse("Restaurant not found"))
                return@patch
            }
            if (restaurant[Restaurants.ownerId] != user.userId) {
                call.respond(HttpStatusCode.Forbidden, LegacyErrorResponse("Access denied"))
                return@patch
            }
            val request = call.receive<UpdateRestaurantRequest>()
            transaction {
                Restaurants.update({ Restaurants.id eq id }) {
                    request.name?.let { v -> it[name] = v }
                    request.description?.let { v -> it[description] = v }
                    request.address?.let { v -> it[address] = v }
                    request.phoneNumber?.let { v -> it[phoneNumber] = v }
                    request.cuisineType?.let { v -> it[cuisineType] = v }
                    request.openingTime?.let { v -> it[openingTime] = v }
                    request.closingTime?.let { v -> it[closingTime] = v }
                    request.imageUrl?.let { v -> it[imageUrl] = v }
                    it[updatedAt] = LocalDateTime.now().toString()
                }
            }
            call.respond(loadRestaurant(id) ?: LegacyErrorResponse("Restaurant not found"))
        }

        delete("/{id}") {
            val user = call.requireUser() ?: run {
                call.respond(HttpStatusCode.Unauthorized, LegacyErrorResponse("Unauthorized"))
                return@delete
            }
            val id = call.parameters["id"]?.toIntOrNull() ?: run {
                call.respond(HttpStatusCode.BadRequest, LegacyErrorResponse("Invalid id"))
                return@delete
            }
            val restaurant = transaction {
                Restaurants.select(Restaurants.id, Restaurants.ownerId)
                    .where { Restaurants.id eq id }.singleOrNull()
            }
            if (restaurant == null) {
                call.respond(HttpStatusCode.NotFound, LegacyErrorResponse("Restaurant not found"))
                return@delete
            }
            if (restaurant[Restaurants.ownerId] != user.userId && user.role != "admin") {
                call.respond(HttpStatusCode.Forbidden, LegacyErrorResponse("Access denied"))
                return@delete
            }
            transaction {
                Restaurants.update({ Restaurants.id eq id }) {
                    it[active] = false
                    it[updatedAt] = LocalDateTime.now().toString()
                }
            }
            eventBus?.publish(EventTypes.RESTAURANT_DELETED, restaurantDeletedPayload(id))
            call.respond(HttpStatusCode.NoContent)
        }
    }

    route("/api/menu") {
        get("/restaurant/{restaurantId}") {
            val restaurantId = call.parameters["restaurantId"]?.toIntOrNull() ?: run {
                call.respond(HttpStatusCode.BadRequest, LegacyErrorResponse("Invalid restaurant id"))
                return@get
            }
            val items = transaction {
                MenuItems.select(
                    MenuItems.id, MenuItems.restaurantId, MenuItems.name, MenuItems.description,
                    MenuItems.price, MenuItems.category, MenuItems.isAvailable,
                ).where { (MenuItems.restaurantId eq restaurantId) and (MenuItems.isAvailable eq true) }
                    .map { it.toMenuItemResponse() }
            }
            call.respond(items)
        }

        get("/{id}") {
            val id = call.parameters["id"]?.toIntOrNull() ?: run {
                call.respond(HttpStatusCode.BadRequest, LegacyErrorResponse("Invalid id"))
                return@get
            }
            val item = transaction {
                MenuItems.select(
                    MenuItems.id, MenuItems.restaurantId, MenuItems.name, MenuItems.description,
                    MenuItems.price, MenuItems.category, MenuItems.isAvailable,
                ).where { MenuItems.id eq id }.map { it.toMenuItemResponse() }.singleOrNull()
            }
            if (item == null) {
                call.respond(HttpStatusCode.NotFound, LegacyErrorResponse("Menu item not found"))
                return@get
            }
            call.respond(item)
        }

        post {
            val user = call.requireUser() ?: run {
                call.respond(HttpStatusCode.Unauthorized, LegacyErrorResponse("Unauthorized"))
                return@post
            }
            val request = call.receive<CreateMenuItemRequest>()
            if (!isOwner(request.restaurantId, user.userId)) {
                call.respond(HttpStatusCode.Forbidden, LegacyErrorResponse("Access denied"))
                return@post
            }
            val id = transaction {
                MenuItems.insert {
                    it[restaurantId] = request.restaurantId
                    it[name] = request.name
                    it[description] = request.description
                    it[price] = BigDecimal(request.price).setScale(2, RoundingMode.HALF_UP)
                    it[category] = request.category
                    it[isAvailable] = request.isAvailable ?: true
                    it[createdAt] = LocalDateTime.now().toString()
                    it[updatedAt] = LocalDateTime.now().toString()
                } get MenuItems.id
            }
            call.respond(HttpStatusCode.Created, MenuItemResponse(
                id.value, request.restaurantId, request.name, request.description,
                request.price, request.category, request.isAvailable ?: true,
            ))
        }

        patch("/{id}") {
            val user = call.requireUser() ?: run {
                call.respond(HttpStatusCode.Unauthorized, LegacyErrorResponse("Unauthorized"))
                return@patch
            }
            val id = call.parameters["id"]?.toIntOrNull() ?: run {
                call.respond(HttpStatusCode.BadRequest, LegacyErrorResponse("Invalid id"))
                return@patch
            }
            val menuItem = transaction {
                MenuItems.select(MenuItems.id, MenuItems.restaurantId).where { MenuItems.id eq id }.singleOrNull()
            } ?: run {
                call.respond(HttpStatusCode.NotFound, LegacyErrorResponse("Menu item not found"))
                return@patch
            }
            if (!isOwner(menuItem[MenuItems.restaurantId], user.userId)) {
                call.respond(HttpStatusCode.Forbidden, LegacyErrorResponse("Access denied"))
                return@patch
            }
            val request = call.receive<UpdateMenuItemRequest>()
            transaction {
                MenuItems.update({ MenuItems.id eq id }) {
                    request.name?.let { v -> it[name] = v }
                    request.description?.let { v -> it[description] = v }
                    request.price?.let { v -> it[price] = BigDecimal(v).setScale(2, RoundingMode.HALF_UP) }
                    request.category?.let { v -> it[category] = v }
                    request.isAvailable?.let { v -> it[isAvailable] = v }
                    it[updatedAt] = LocalDateTime.now().toString()
                }
            }
            val updated = transaction {
                MenuItems.select(
                    MenuItems.id, MenuItems.restaurantId, MenuItems.name, MenuItems.description,
                    MenuItems.price, MenuItems.category, MenuItems.isAvailable,
                ).where { MenuItems.id eq id }.map { it.toMenuItemResponse() }.single()
            }
            call.respond(updated)
        }

        delete("/{id}") {
            val user = call.requireUser() ?: run {
                call.respond(HttpStatusCode.Unauthorized, LegacyErrorResponse("Unauthorized"))
                return@delete
            }
            val id = call.parameters["id"]?.toIntOrNull() ?: run {
                call.respond(HttpStatusCode.BadRequest, LegacyErrorResponse("Invalid id"))
                return@delete
            }
            val menuItem = transaction {
                MenuItems.select(MenuItems.id, MenuItems.restaurantId).where { MenuItems.id eq id }.singleOrNull()
            } ?: run {
                call.respond(HttpStatusCode.NotFound, LegacyErrorResponse("Menu item not found"))
                return@delete
            }
            if (!isOwner(menuItem[MenuItems.restaurantId], user.userId)) {
                call.respond(HttpStatusCode.Forbidden, LegacyErrorResponse("Access denied"))
                return@delete
            }
            transaction { MenuItems.deleteWhere { MenuItems.id eq id } }
            call.respond(HttpStatusCode.NoContent)
        }
    }
}

fun Route.restaurantInternalRoutes() {
    route("/internal/restaurants") {
        get("/{restaurantId}") {
            val restaurantId = call.parameters["restaurantId"]?.toIntOrNull() ?: run {
                call.respond(HttpStatusCode.BadRequest, ApiError("BAD_REQUEST", "Invalid restaurant id"))
                return@get
            }
            val r = loadInternalRestaurant(restaurantId)
            if (r == null) {
                call.respond(HttpStatusCode.NotFound, ApiError("RESTAURANT_NOT_FOUND", "Restaurant was not found"))
                return@get
            }
            call.respond(r)
        }
        get("/{restaurantId}/ownership") {
            val restaurantId = call.parameters["restaurantId"]?.toIntOrNull() ?: run {
                call.respond(HttpStatusCode.BadRequest, ApiError("BAD_REQUEST", "Invalid restaurant id"))
                return@get
            }
            val ownerId = call.request.queryParameters["ownerId"]?.toIntOrNull() ?: run {
                call.respond(HttpStatusCode.BadRequest, ApiError("BAD_REQUEST", "ownerId is required"))
                return@get
            }
            val row = transaction {
                Restaurants.select(Restaurants.id, Restaurants.ownerId, Restaurants.active)
                    .where { Restaurants.id eq restaurantId }.singleOrNull()
            }
            if (row == null || !row[Restaurants.active]) {
                call.respond(HttpStatusCode.NotFound, ApiError("RESTAURANT_NOT_FOUND", "Restaurant was not found"))
                return@get
            }
            call.respond(OwnershipResponse(restaurantId, ownerId, row[Restaurants.ownerId] == ownerId))
        }
        put("/{restaurantId}/rating") {
            val restaurantId = call.parameters["restaurantId"]?.toIntOrNull() ?: run {
                call.respond(HttpStatusCode.BadRequest, ApiError("BAD_REQUEST", "Invalid restaurant id"))
                return@put
            }
            val request = call.receive<UpdateRatingRequest>()
            val updated = transaction {
                val exists = Restaurants.select(Restaurants.id).where { Restaurants.id eq restaurantId }.singleOrNull()
                if (exists == null) return@transaction false
                Restaurants.update({ Restaurants.id eq restaurantId }) {
                    it[rating] = BigDecimal(request.rating).setScale(1, RoundingMode.HALF_UP)
                    it[reviewsCount] = request.reviewsCount
                    it[updatedAt] = LocalDateTime.now().toString()
                }
                true
            }
            if (!updated) {
                call.respond(HttpStatusCode.NotFound, ApiError("RESTAURANT_NOT_FOUND", "Restaurant was not found"))
                return@put
            }
            call.respond(RatingResponse(restaurantId, request.rating, request.reviewsCount))
        }
    }
}

fun updateRatingFromFeedback(restaurantId: Int, averageRating: Double, count: Int) {
    transaction {
        Restaurants.update({ Restaurants.id eq restaurantId }) {
            it[rating] = BigDecimal(averageRating).setScale(1, RoundingMode.HALF_UP)
            it[reviewsCount] = count
            it[updatedAt] = LocalDateTime.now().toString()
        }
    }
}

private fun isOwner(restaurantId: Int, userId: Int): Boolean = transaction {
    Restaurants.select(Restaurants.ownerId, Restaurants.active)
        .where { Restaurants.id eq restaurantId }.singleOrNull()
        ?.let { it[Restaurants.active] && it[Restaurants.ownerId] == userId } ?: false
}

private fun loadRestaurant(id: Int): RestaurantResponse? = transaction {
    Restaurants.select(
        Restaurants.id, Restaurants.name, Restaurants.description, Restaurants.address,
        Restaurants.phoneNumber, Restaurants.cuisineType, Restaurants.rating,
        Restaurants.imageUrl, Restaurants.ownerId,
    ).where { Restaurants.id eq id }.map { it.toRestaurantResponse() }.singleOrNull()
}

private fun loadInternalRestaurant(id: Int): InternalRestaurantResponse? = transaction {
    Restaurants.select(
        Restaurants.id, Restaurants.name, Restaurants.address, Restaurants.ownerId,
        Restaurants.rating, Restaurants.active, Restaurants.openingTime, Restaurants.closingTime,
    ).where { Restaurants.id eq id }.map {
        InternalRestaurantResponse(
            id = it[Restaurants.id].value,
            name = it[Restaurants.name],
            address = it[Restaurants.address],
            ownerId = it[Restaurants.ownerId],
            rating = it[Restaurants.rating].toDouble(),
            active = it[Restaurants.active],
            openingTime = it[Restaurants.openingTime],
            closingTime = it[Restaurants.closingTime],
        )
    }.singleOrNull()
}

private fun org.jetbrains.exposed.sql.ResultRow.toRestaurantResponse() = RestaurantResponse(
    id = this[Restaurants.id].value,
    name = this[Restaurants.name],
    description = this[Restaurants.description],
    address = this[Restaurants.address],
    phoneNumber = this[Restaurants.phoneNumber],
    cuisineType = this[Restaurants.cuisineType],
    openingTime = this[Restaurants.openingTime],
    closingTime = this[Restaurants.closingTime],
    rating = this[Restaurants.rating].toDouble(),
    imageUrl = this[Restaurants.imageUrl],
    ownerId = this[Restaurants.ownerId],
)

private fun org.jetbrains.exposed.sql.ResultRow.toMenuItemResponse() = MenuItemResponse(
    id = this[MenuItems.id].value,
    restaurantId = this[MenuItems.restaurantId],
    name = this[MenuItems.name],
    description = this[MenuItems.description],
    price = this[MenuItems.price].toDouble(),
    category = this[MenuItems.category],
    isAvailable = this[MenuItems.isAvailable],
)
