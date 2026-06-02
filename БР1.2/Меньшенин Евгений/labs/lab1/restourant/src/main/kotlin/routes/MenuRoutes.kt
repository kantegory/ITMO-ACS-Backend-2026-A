package com.mezhendosina.routes

import com.mezhendosina.database.*
import com.mezhendosina.database.MenuItems
import com.mezhendosina.database.Restaurants
import io.ktor.http.*
import io.ktor.server.auth.*
import io.ktor.server.request.*
import io.ktor.server.response.*
import io.ktor.server.routing.*
import org.jetbrains.exposed.sql.SqlExpressionBuilder.eq
import org.jetbrains.exposed.sql.and
import org.jetbrains.exposed.sql.deleteWhere
import org.jetbrains.exposed.sql.insert
import org.jetbrains.exposed.sql.select
import org.jetbrains.exposed.sql.transactions.transaction
import org.jetbrains.exposed.sql.update
import java.math.BigDecimal
import java.time.LocalDateTime

fun Route.menuRoutes() {
    route("/menu") {
        get("/restaurant/{restaurantId}") {
            val restaurantId = call.parameters["restaurantId"]?.toIntOrNull() ?: run {
                call.respond(HttpStatusCode.BadRequest, ErrorResponse("Invalid restaurant id"))
                return@get
            }

            val menuItems = transaction {
                MenuItems.select(
                    MenuItems.id, MenuItems.restaurantId, MenuItems.name,
                    MenuItems.description, MenuItems.price, MenuItems.category,
                    MenuItems.isAvailable,
                ).where {
                    (MenuItems.restaurantId eq restaurantId) and (MenuItems.isAvailable eq true)
                }.map { row ->
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
            }

            call.respond(menuItems)
        }

        get("/{id}") {
            val id = call.parameters["id"]?.toIntOrNull() ?: run {
                call.respond(HttpStatusCode.BadRequest, ErrorResponse("Invalid id"))
                return@get
            }

            val menuItem = transaction {
                MenuItems.select(
                    MenuItems.id, MenuItems.restaurantId, MenuItems.name,
                    MenuItems.description, MenuItems.price, MenuItems.category,
                    MenuItems.isAvailable,
                ).where { MenuItems.id eq id }.map { row ->
                    MenuItemResponse(
                        id = row[MenuItems.id].value,
                        restaurantId = row[MenuItems.restaurantId],
                        name = row[MenuItems.name],
                        description = row[MenuItems.description],
                        price = row[MenuItems.price].toDouble(),
                        category = row[MenuItems.category],
                        isAvailable = row[MenuItems.isAvailable],
                    )
                }.singleOrNull()
            }

            if (menuItem == null) {
                call.respond(HttpStatusCode.NotFound, ErrorResponse("Menu item not found"))
                return@get
            }

            call.respond(menuItem)
        }

        authenticate("auth-jwt") {
            post {
                val userId = call.principalUserId()!!
                val request = call.receive<CreateMenuItemRequest>()

                val restaurant = transaction {
                    Restaurants.select(Restaurants.id, Restaurants.ownerId)
                        .where { Restaurants.id eq request.restaurantId }
                        .singleOrNull()
                }

                if (restaurant == null) {
                    call.respond(HttpStatusCode.NotFound, ErrorResponse("Restaurant not found"))
                    return@post
                }

                if (restaurant[Restaurants.ownerId] != userId) {
                    call.respond(HttpStatusCode.Forbidden, ErrorResponse("Access denied"))
                    return@post
                }

                val id = transaction {
                    MenuItems.insert {
                        it[restaurantId] = request.restaurantId
                        it[name] = request.name
                        it[description] = request.description
                        it[price] = BigDecimal(request.price).setScale(2, java.math.RoundingMode.HALF_UP)
                        it[category] = request.category
                        it[isAvailable] = request.isAvailable ?: true
                        it[createdAt] = LocalDateTime.now().toString()
                        it[updatedAt] = LocalDateTime.now().toString()
                    } get MenuItems.id
                }

                call.respond(
                    HttpStatusCode.Created,
                    MenuItemResponse(
                        id = id.value,
                        restaurantId = request.restaurantId,
                        name = request.name,
                        description = request.description,
                        price = request.price,
                        category = request.category,
                        isAvailable = request.isAvailable ?: true,
                    )
                )
            }

            patch("/{id}") {
                val userId = call.principalUserId()!!
                val id = call.parameters["id"]?.toIntOrNull() ?: run {
                    call.respond(HttpStatusCode.BadRequest, ErrorResponse("Invalid id"))
                    return@patch
                }

                val menuItem = transaction {
                    MenuItems.select(MenuItems.id, MenuItems.restaurantId)
                        .where { MenuItems.id eq id }
                        .singleOrNull()
                }

                if (menuItem == null) {
                    call.respond(HttpStatusCode.NotFound, ErrorResponse("Menu item not found"))
                    return@patch
                }

                val restaurant = transaction {
                    Restaurants.select(Restaurants.id, Restaurants.ownerId)
                        .where { Restaurants.id eq menuItem[MenuItems.restaurantId] }
                        .singleOrNull()
                }

                if (restaurant == null || restaurant[Restaurants.ownerId] != userId) {
                    call.respond(HttpStatusCode.Forbidden, ErrorResponse("Access denied"))
                    return@patch
                }

                val request = call.receive<UpdateMenuItemRequest>()

                transaction {
                    MenuItems.update({ MenuItems.id eq id }) {
                        request.name?.let { v -> it[name] = v }
                        request.description?.let { v -> it[description] = v }
                        request.price?.let { v -> it[price] = BigDecimal(v).setScale(2, java.math.RoundingMode.HALF_UP) }
                        request.category?.let { v -> it[category] = v }
                        request.isAvailable?.let { v -> it[isAvailable] = v }
                        it[updatedAt] = LocalDateTime.now().toString()
                    }
                }

                val updated = transaction {
                    MenuItems.select(
                        MenuItems.id, MenuItems.restaurantId, MenuItems.name,
                        MenuItems.description, MenuItems.price, MenuItems.category,
                        MenuItems.isAvailable,
                    ).where { MenuItems.id eq id }.map { row ->
                        MenuItemResponse(
                            id = row[MenuItems.id].value,
                            restaurantId = row[MenuItems.restaurantId],
                            name = row[MenuItems.name],
                            description = row[MenuItems.description],
                            price = row[MenuItems.price].toDouble(),
                            category = row[MenuItems.category],
                            isAvailable = row[MenuItems.isAvailable],
                        )
                    }.single()
                }

                call.respond(updated)
            }

            delete("/{id}") {
                val userId = call.principalUserId()!!
                val id = call.parameters["id"]?.toIntOrNull() ?: run {
                    call.respond(HttpStatusCode.BadRequest, ErrorResponse("Invalid id"))
                    return@delete
                }

                val menuItem = transaction {
                    MenuItems.select(MenuItems.id, MenuItems.restaurantId)
                        .where { MenuItems.id eq id }
                        .singleOrNull()
                }

                if (menuItem == null) {
                    call.respond(HttpStatusCode.NotFound, ErrorResponse("Menu item not found"))
                    return@delete
                }

                val restaurant = transaction {
                    Restaurants.select(Restaurants.id, Restaurants.ownerId)
                        .where { Restaurants.id eq menuItem[MenuItems.restaurantId] }
                        .singleOrNull()
                }

                if (restaurant == null || restaurant[Restaurants.ownerId] != userId) {
                    call.respond(HttpStatusCode.Forbidden, ErrorResponse("Access denied"))
                    return@delete
                }

                transaction {
                    MenuItems.deleteWhere { MenuItems.id eq id }
                }

                call.respond(HttpStatusCode.NoContent)
            }
        }
    }
}
