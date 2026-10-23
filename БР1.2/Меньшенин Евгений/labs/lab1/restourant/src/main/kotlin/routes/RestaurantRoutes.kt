package com.mezhendosina.routes

import com.mezhendosina.database.CreateRestaurantRequest
import com.mezhendosina.database.ErrorResponse
import com.mezhendosina.database.MenuItemResponse
import com.mezhendosina.database.MenuItems
import com.mezhendosina.database.RestaurantDetailResponse
import com.mezhendosina.database.RestaurantResponse
import com.mezhendosina.database.Restaurants
import com.mezhendosina.database.RestaurantsListResponse
import com.mezhendosina.database.ReviewWithUserResponse
import com.mezhendosina.database.Reviews
import com.mezhendosina.database.UpdateRestaurantRequest
import io.ktor.http.HttpStatusCode
import io.ktor.server.auth.authenticate
import io.ktor.server.request.receive
import io.ktor.server.response.respond
import io.ktor.server.routing.Route
import io.ktor.server.routing.get
import io.ktor.server.routing.patch
import io.ktor.server.routing.post
import io.ktor.server.routing.route
import org.jetbrains.exposed.sql.Op
import org.jetbrains.exposed.sql.SqlExpressionBuilder.greaterEq
import org.jetbrains.exposed.sql.SqlExpressionBuilder.like
import org.jetbrains.exposed.sql.and
import org.jetbrains.exposed.sql.insert
import org.jetbrains.exposed.sql.select
import org.jetbrains.exposed.sql.transactions.transaction
import org.jetbrains.exposed.sql.update
import java.math.BigDecimal
import java.time.LocalDateTime

fun Route.restaurantRoutes() {
    route("/restaurants") {
        get {
            val cuisine = call.request.queryParameters["cuisine"]
            val location = call.request.queryParameters["location"]
            val minRating = call.request.queryParameters["minRating"]?.toDoubleOrNull()
            val page = call.request.queryParameters["page"]?.toIntOrNull() ?: 1
            val limit = call.request.queryParameters["limit"]?.toIntOrNull() ?: 20

            val restaurants = transaction {
                var condition: Op<Boolean> = Op.TRUE
                if (cuisine != null) {
                    condition = condition and (Restaurants.cuisineType like "%$cuisine%")
                }
                if (location != null) {
                    condition = condition and (Restaurants.address like "%$location%")
                }
                if (minRating != null) {
                    condition = condition and (Restaurants.rating greaterEq BigDecimal(minRating))
                }

                val query = Restaurants.select(
                    Restaurants.id, Restaurants.name, Restaurants.description,
                    Restaurants.address, Restaurants.phoneNumber, Restaurants.cuisineType,
                    Restaurants.openingTime, Restaurants.closingTime, Restaurants.rating,
                    Restaurants.imageUrl, Restaurants.ownerId,
                ).where(condition)

                val total = query.count().toInt()
                val paged = query
                    .limit(limit)
                    .offset(((page - 1) * limit).toLong())
                    .map { row ->
                        RestaurantResponse(
                            id = row[Restaurants.id].value,
                            name = row[Restaurants.name],
                            description = row[Restaurants.description],
                            address = row[Restaurants.address],
                            phoneNumber = row[Restaurants.phoneNumber],
                            cuisineType = row[Restaurants.cuisineType],
                            rating = row[Restaurants.rating].toDouble(),
                            imageUrl = row[Restaurants.imageUrl],
                            ownerId = row[Restaurants.ownerId],
                        )
                    }
                Pair(paged, total)
            }

            call.respond(
                RestaurantsListResponse(
                    restaurants = restaurants.first,
                    total = restaurants.second,
                    page = page,
                    limit = limit,
                )
            )
        }

        get("/{id}") {
            val id = call.parameters["id"]?.toIntOrNull() ?: run {
                call.respond(HttpStatusCode.BadRequest, ErrorResponse("Invalid id"))
                return@get
            }

            val result = transaction {
                val restaurant = Restaurants.select(
                    Restaurants.id, Restaurants.name, Restaurants.description,
                    Restaurants.address, Restaurants.phoneNumber, Restaurants.cuisineType,
                    Restaurants.openingTime, Restaurants.closingTime, Restaurants.rating,
                    Restaurants.imageUrl, Restaurants.ownerId,
                ).where { Restaurants.id eq id }.singleOrNull()
                    ?: return@transaction null

                val menu = MenuItems.select(
                    MenuItems.id, MenuItems.restaurantId, MenuItems.name,
                    MenuItems.description, MenuItems.price, MenuItems.category,
                    MenuItems.isAvailable,
                ).where { MenuItems.restaurantId eq id }.map { row ->
                    MenuItemResponse(
                        id = row[MenuItems.id].value,
                        restaurantId = row[MenuItems.restaurantId],
                        name = row[MenuItems.name],
                        description = row[MenuItems.description],
                        price = row[MenuItems.price].toDouble(),
                        category = row[MenuItems.category],
                        isAvailable = row[MenuItems.isAvailable],
                    )
                }

                val reviews = Reviews.select(
                    Reviews.id, Reviews.userId, Reviews.restaurantId,
                    Reviews.rating, Reviews.comment,
                ).where { Reviews.restaurantId eq id }.map { row ->
                    ReviewWithUserResponse(
                        id = row[Reviews.id].value,
                        userId = row[Reviews.userId],
                        restaurantId = row[Reviews.restaurantId],
                        rating = row[Reviews.rating],
                        comment = row[Reviews.comment],
                    )
                }

                RestaurantDetailResponse(
                    id = restaurant[Restaurants.id].value,
                    name = restaurant[Restaurants.name],
                    description = restaurant[Restaurants.description],
                    address = restaurant[Restaurants.address],
                    phoneNumber = restaurant[Restaurants.phoneNumber],
                    cuisineType = restaurant[Restaurants.cuisineType],
                    openingTime = restaurant[Restaurants.openingTime],
                    closingTime = restaurant[Restaurants.closingTime],
                    rating = restaurant[Restaurants.rating].toDouble(),
                    imageUrl = restaurant[Restaurants.imageUrl],
                    ownerId = restaurant[Restaurants.ownerId],
                    menu = menu,
                    reviews = reviews,
                )
            }

            if (result == null) {
                call.respond(HttpStatusCode.NotFound, ErrorResponse("Restaurant not found"))
                return@get
            }

            call.respond(result)
        }

        authenticate("auth-jwt") {
            post {
                val userId = call.principalUserId()!!
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
                        it[ownerId] = userId
                        it[createdAt] = LocalDateTime.now().toString()
                        it[updatedAt] = LocalDateTime.now().toString()
                    } get Restaurants.id
                }

                call.respond(
                    HttpStatusCode.Created,
                    RestaurantResponse(
                        id = id.value,
                        name = request.name,
                        description = request.description,
                        address = request.address,
                        phoneNumber = request.phoneNumber,
                        cuisineType = request.cuisineType,
                        openingTime = request.openingTime,
                        closingTime = request.closingTime,
                        imageUrl = request.imageUrl,
                        ownerId = userId,
                    )
                )
            }

            patch("/{id}") {
                val userId = call.principalUserId()!!
                val id = call.parameters["id"]?.toIntOrNull() ?: run {
                    call.respond(HttpStatusCode.BadRequest, ErrorResponse("Invalid id"))
                    return@patch
                }

                val restaurant = transaction {
                    Restaurants.select(Restaurants.id, Restaurants.ownerId)
                        .where { Restaurants.id eq id }
                        .singleOrNull()
                }

                if (restaurant == null) {
                    call.respond(HttpStatusCode.NotFound, ErrorResponse("Restaurant not found"))
                    return@patch
                }

                if (restaurant[Restaurants.ownerId] != userId) {
                    call.respond(HttpStatusCode.Forbidden, ErrorResponse("Access denied"))
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

                val updated = transaction {
                    Restaurants.select(
                        Restaurants.id, Restaurants.name, Restaurants.description,
                        Restaurants.address, Restaurants.phoneNumber, Restaurants.cuisineType,
                        Restaurants.rating, Restaurants.imageUrl, Restaurants.ownerId,
                    ).where { Restaurants.id eq id }.map { row ->
                        RestaurantResponse(
                            id = row[Restaurants.id].value,
                            name = row[Restaurants.name],
                            description = row[Restaurants.description],
                            address = row[Restaurants.address],
                            phoneNumber = row[Restaurants.phoneNumber],
                            cuisineType = row[Restaurants.cuisineType],
                            rating = row[Restaurants.rating].toDouble(),
                            imageUrl = row[Restaurants.imageUrl],
                            ownerId = row[Restaurants.ownerId],
                        )
                    }.single()
                }

                call.respond(updated)
            }
        }
    }
}
