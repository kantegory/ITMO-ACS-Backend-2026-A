package com.mezhendosina.routes

import com.mezhendosina.database.Bookings
import com.mezhendosina.database.CreateTableRequest
import com.mezhendosina.database.ErrorResponse
import com.mezhendosina.database.Restaurants
import com.mezhendosina.database.TableResponse
import com.mezhendosina.database.Tables
import com.mezhendosina.database.TablesListResponse
import com.mezhendosina.database.UpdateTableRequest
import io.ktor.http.HttpStatusCode
import io.ktor.server.auth.authenticate
import io.ktor.server.request.receive
import io.ktor.server.response.respond
import io.ktor.server.routing.Route
import io.ktor.server.routing.delete
import io.ktor.server.routing.get
import io.ktor.server.routing.patch
import io.ktor.server.routing.post
import io.ktor.server.routing.route
import org.jetbrains.exposed.sql.Op
import org.jetbrains.exposed.sql.SqlExpressionBuilder.eq
import org.jetbrains.exposed.sql.SqlExpressionBuilder.greaterEq
import org.jetbrains.exposed.sql.and
import org.jetbrains.exposed.sql.deleteWhere
import org.jetbrains.exposed.sql.insert
import org.jetbrains.exposed.sql.or
import org.jetbrains.exposed.sql.select
import org.jetbrains.exposed.sql.transactions.transaction
import org.jetbrains.exposed.sql.update
import java.time.LocalDateTime

fun Route.tableRoutes() {
    route("/tables") {
        get {
            val restaurantId = call.request.queryParameters["restaurantId"]?.toIntOrNull()
            val date = call.request.queryParameters["date"]
            val guests = call.request.queryParameters["guests"]?.toIntOrNull()

            if (restaurantId == null) {
                call.respond(HttpStatusCode.BadRequest, ErrorResponse("Restaurant ID is required"))
                return@get
            }

            val restaurant = transaction {
                Restaurants.select(
                    Restaurants.id, Restaurants.openingTime, Restaurants.closingTime,
                ).where { Restaurants.id eq restaurantId }.singleOrNull()
            }

            if (restaurant == null) {
                call.respond(HttpStatusCode.NotFound, ErrorResponse("Restaurant not found"))
                return@get
            }

            val tables = transaction {
                var condition: Op<Boolean> = Tables.restaurantId eq restaurantId
                if (guests != null) {
                    condition = condition and (Tables.capacity greaterEq guests)
                }

                Tables.select(
                    Tables.id, Tables.restaurantId, Tables.tableNumber,
                    Tables.capacity, Tables.locationDescription, Tables.isAvailable,
                ).where(condition).map { row ->
                    TableResponse(
                        id = row[Tables.id].value,
                        restaurantId = row[Tables.restaurantId],
                        tableNumber = row[Tables.tableNumber],
                        capacity = row[Tables.capacity],
                        locationDescription = row[Tables.locationDescription],
                        isAvailable = row[Tables.isAvailable],
                    )
                }
            }

            val tablesWithAvailability = if (date != null) {
                val tableIds = tables.map { it.id }
                if (tableIds.isEmpty()) {
                    call.respond(TablesListResponse(tables = tables, date = date))
                    return@get
                }

                val bookings = transaction {
                    Bookings.select(Bookings.tableId, Bookings.startTime, Bookings.endTime).where {
                        (Bookings.tableId inList tableIds) and
                        (Bookings.bookingDate eq date) and
                        ((Bookings.status eq "confirmed") or (Bookings.status eq "pending"))
                    }.map { row ->
                        Triple(row[Bookings.tableId], row[Bookings.startTime], row[Bookings.endTime])
                    }
                }

                val openingTime = restaurant[Restaurants.openingTime] ?: "10:00"
                val closingTime = restaurant[Restaurants.closingTime] ?: "23:00"
                val openHour = openingTime.split(":")[0].toInt()
                val closeHour = closingTime.split(":")[0].toInt()

                tables.map { table ->
                    val tableBookings = bookings.filter { it.first == table.id }
                    val availableSlots = (openHour until closeHour).mapNotNull { hour ->
                        val time = "${hour.toString().padStart(2, '0')}:00"
                        val isAvailable = tableBookings.none { booking ->
                            val startHour = booking.second.split(":")[0].toInt()
                            val endHour = booking.third.split(":")[0].toInt()
                            hour >= startHour && hour < endHour
                        }
                        if (isAvailable) time else null
                    }
                    table.copy(availableTimeSlots = availableSlots)
                }
            } else {
                tables
            }

            call.respond(TablesListResponse(tables = tablesWithAvailability, date = date))
        }

        get("/{id}") {
            val id = call.parameters["id"]?.toIntOrNull() ?: run {
                call.respond(HttpStatusCode.BadRequest, ErrorResponse("Invalid id"))
                return@get
            }

            val table = transaction {
                Tables.select(
                    Tables.id, Tables.restaurantId, Tables.tableNumber,
                    Tables.capacity, Tables.locationDescription, Tables.isAvailable,
                ).where { Tables.id eq id }.map { row ->
                    TableResponse(
                        id = row[Tables.id].value,
                        restaurantId = row[Tables.restaurantId],
                        tableNumber = row[Tables.tableNumber],
                        capacity = row[Tables.capacity],
                        locationDescription = row[Tables.locationDescription],
                        isAvailable = row[Tables.isAvailable],
                    )
                }.singleOrNull()
            }

            if (table == null) {
                call.respond(HttpStatusCode.NotFound, ErrorResponse("Table not found"))
                return@get
            }

            call.respond(table)
        }

        authenticate("auth-jwt") {
            post {
                val userId = call.principalUserId()!!
                val request = call.receive<CreateTableRequest>()

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
                    Tables.insert {
                        it[restaurantId] = request.restaurantId
                        it[tableNumber] = request.tableNumber
                        it[capacity] = request.capacity
                        it[locationDescription] = request.locationDescription
                        it[createdAt] = LocalDateTime.now().toString()
                        it[updatedAt] = LocalDateTime.now().toString()
                    } get Tables.id
                }

                call.respond(
                    HttpStatusCode.Created,
                    TableResponse(
                        id = id.value,
                        restaurantId = request.restaurantId,
                        tableNumber = request.tableNumber,
                        capacity = request.capacity,
                        locationDescription = request.locationDescription,
                    )
                )
            }

            patch("/{id}") {
                val userId = call.principalUserId()!!
                val id = call.parameters["id"]?.toIntOrNull() ?: run {
                    call.respond(HttpStatusCode.BadRequest, ErrorResponse("Invalid id"))
                    return@patch
                }

                val table = transaction {
                    Tables.select(Tables.id, Tables.restaurantId)
                        .where { Tables.id eq id }
                        .singleOrNull()
                }

                if (table == null) {
                    call.respond(HttpStatusCode.NotFound, ErrorResponse("Table not found"))
                    return@patch
                }

                val restaurant = transaction {
                    Restaurants.select(Restaurants.id, Restaurants.ownerId)
                        .where { Restaurants.id eq table[Tables.restaurantId] }
                        .singleOrNull()
                }

                if (restaurant == null || restaurant[Restaurants.ownerId] != userId) {
                    call.respond(HttpStatusCode.Forbidden, ErrorResponse("Access denied"))
                    return@patch
                }

                val request = call.receive<UpdateTableRequest>()

                transaction {
                    Tables.update({ Tables.id eq id }) {
                        request.tableNumber?.let { v -> it[tableNumber] = v }
                        request.capacity?.let { v -> it[capacity] = v }
                        request.locationDescription?.let { v -> it[locationDescription] = v }
                        request.isAvailable?.let { v -> it[isAvailable] = v }
                        it[updatedAt] = LocalDateTime.now().toString()
                    }
                }

                val updated = transaction {
                    Tables.select(
                        Tables.id, Tables.restaurantId, Tables.tableNumber,
                        Tables.capacity, Tables.locationDescription, Tables.isAvailable,
                    ).where { Tables.id eq id }.map { row ->
                        TableResponse(
                            id = row[Tables.id].value,
                            restaurantId = row[Tables.restaurantId],
                            tableNumber = row[Tables.tableNumber],
                            capacity = row[Tables.capacity],
                            locationDescription = row[Tables.locationDescription],
                            isAvailable = row[Tables.isAvailable],
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

                val table = transaction {
                    Tables.select(Tables.id, Tables.restaurantId)
                        .where { Tables.id eq id }
                        .singleOrNull()
                }

                if (table == null) {
                    call.respond(HttpStatusCode.NotFound, ErrorResponse("Table not found"))
                    return@delete
                }

                val restaurant = transaction {
                    Restaurants.select(Restaurants.id, Restaurants.ownerId)
                        .where { Restaurants.id eq table[Tables.restaurantId] }
                        .singleOrNull()
                }

                if (restaurant == null || restaurant[Restaurants.ownerId] != userId) {
                    call.respond(HttpStatusCode.Forbidden, ErrorResponse("Access denied"))
                    return@delete
                }

                transaction {
                    Tables.deleteWhere { Tables.id eq id }
                }

                call.respond(HttpStatusCode.NoContent)
            }
        }
    }
}
