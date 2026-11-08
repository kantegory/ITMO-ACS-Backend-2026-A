package com.restaurant.availability

import com.restaurant.shared.events.EventTypes
import com.restaurant.shared.models.ApiError
import com.restaurant.shared.models.AvailabilityCheckRequest
import com.restaurant.shared.models.AvailabilityCheckResponse
import com.restaurant.shared.models.CreateTableRequest
import com.restaurant.shared.models.InternalTableResponse
import com.restaurant.shared.models.LegacyErrorResponse
import com.restaurant.shared.models.ReleaseSlotRequest
import com.restaurant.shared.models.ReleaseSlotResponse
import com.restaurant.shared.models.ReserveSlotRequest
import com.restaurant.shared.models.ReserveSlotResponse
import com.restaurant.shared.models.TableResponse
import com.restaurant.shared.models.TablesListResponse
import com.restaurant.shared.models.UpdateTableRequest
import com.restaurant.shared.plugins.requestId
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
import kotlinx.coroutines.runBlocking
import kotlinx.serialization.json.jsonPrimitive
import org.jetbrains.exposed.sql.SqlExpressionBuilder.eq
import org.jetbrains.exposed.sql.SqlExpressionBuilder.greaterEq
import org.jetbrains.exposed.sql.and
import org.jetbrains.exposed.sql.deleteWhere
import org.jetbrains.exposed.sql.insert
import org.jetbrains.exposed.sql.select
import org.jetbrains.exposed.sql.transactions.transaction
import org.jetbrains.exposed.sql.update
import java.time.LocalDateTime

fun Route.availabilityPublicRoutes(restaurantClient: RestaurantClient) {
    route("/api/tables") {
        get {
            val restaurantId = call.request.queryParameters["restaurantId"]?.toIntOrNull()
            val date = call.request.queryParameters["date"]
            val guests = call.request.queryParameters["guests"]?.toIntOrNull()
            if (restaurantId == null) {
                call.respond(HttpStatusCode.BadRequest, LegacyErrorResponse("Restaurant ID is required"))
                return@get
            }
            val restaurant = runBlocking { restaurantClient.getRestaurant(restaurantId, call.requestId()) }
            if (restaurant == null || !restaurant.active) {
                call.respond(HttpStatusCode.NotFound, LegacyErrorResponse("Restaurant not found"))
                return@get
            }
            val tables = transaction {
                var condition = (Tables.restaurantId eq restaurantId) and (Tables.active eq true)
                if (guests != null) condition = condition and (Tables.capacity greaterEq guests)
                Tables.select(
                    Tables.id, Tables.restaurantId, Tables.tableNumber, Tables.capacity,
                    Tables.locationDescription, Tables.isAvailable,
                ).where(condition).map { it.toTableResponse() }
            }
            val withSlots = if (date != null) {
                val openingTime = restaurant.openingTime ?: "10:00"
                val closingTime = restaurant.closingTime ?: "23:00"
                val openHour = openingTime.split(":")[0].toInt()
                val closeHour = closingTime.split(":")[0].toInt()
                tables.map { table ->
                    val reserved = transaction {
                        TableReservations.select(TableReservations.startTime, TableReservations.endTime).where {
                            (TableReservations.tableId eq table.id) and
                                (TableReservations.bookingDate eq date) and
                                (TableReservations.status eq "reserved")
                        }.map { Pair(it[TableReservations.startTime], it[TableReservations.endTime]) }
                    }
                    val slots = (openHour until closeHour).mapNotNull { hour ->
                        val time = "${hour.toString().padStart(2, '0')}:00"
                        val busy = reserved.any { (s, e) ->
                            val h = hour
                            val sh = s.split(":")[0].toInt()
                            val eh = e.split(":")[0].toInt()
                            h >= sh && h < eh
                        }
                        if (!busy) time else null
                    }
                    table.copy(availableTimeSlots = slots)
                }
            } else tables
            call.respond(TablesListResponse(withSlots, date))
        }

        get("/{id}") {
            val id = call.parameters["id"]?.toIntOrNull() ?: run {
                call.respond(HttpStatusCode.BadRequest, LegacyErrorResponse("Invalid id"))
                return@get
            }
            val table = loadTable(id)
            if (table == null) {
                call.respond(HttpStatusCode.NotFound, LegacyErrorResponse("Table not found"))
                return@get
            }
            call.respond(table)
        }

        post {
            val user = call.requireUser() ?: run {
                call.respond(HttpStatusCode.Unauthorized, LegacyErrorResponse("Unauthorized"))
                return@post
            }
            val request = call.receive<CreateTableRequest>()
            val isOwner = runBlocking {
                restaurantClient.checkOwnership(request.restaurantId, user.userId, call.requestId())
            }
            if (!isOwner) {
                call.respond(HttpStatusCode.Forbidden, LegacyErrorResponse("Access denied"))
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
            call.respond(HttpStatusCode.Created, TableResponse(
                id.value, request.restaurantId, request.tableNumber, request.capacity, request.locationDescription,
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
            val tableRow = transaction {
                Tables.select(Tables.id, Tables.restaurantId).where { Tables.id eq id }.singleOrNull()
            } ?: run {
                call.respond(HttpStatusCode.NotFound, LegacyErrorResponse("Table not found"))
                return@patch
            }
            val isOwner = runBlocking {
                restaurantClient.checkOwnership(tableRow[Tables.restaurantId], user.userId, call.requestId())
            }
            if (!isOwner) {
                call.respond(HttpStatusCode.Forbidden, LegacyErrorResponse("Access denied"))
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
            call.respond(loadTable(id)!!)
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
            val tableRow = transaction {
                Tables.select(Tables.id, Tables.restaurantId).where { Tables.id eq id }.singleOrNull()
            } ?: run {
                call.respond(HttpStatusCode.NotFound, LegacyErrorResponse("Table not found"))
                return@delete
            }
            val isOwner = runBlocking {
                restaurantClient.checkOwnership(tableRow[Tables.restaurantId], user.userId, call.requestId())
            }
            if (!isOwner) {
                call.respond(HttpStatusCode.Forbidden, LegacyErrorResponse("Access denied"))
                return@delete
            }
            transaction {
                Tables.update({ Tables.id eq id }) {
                    it[active] = false
                    it[updatedAt] = LocalDateTime.now().toString()
                }
            }
            call.respond(HttpStatusCode.NoContent)
        }
    }
}

fun Route.availabilityInternalRoutes() {
    route("/internal") {
        get("/tables/{tableId}") {
            val tableId = call.parameters["tableId"]?.toIntOrNull() ?: run {
                call.respond(HttpStatusCode.BadRequest, ApiError("BAD_REQUEST", "Invalid table id"))
                return@get
            }
            val table = transaction {
                Tables.select(
                    Tables.id, Tables.restaurantId, Tables.tableNumber, Tables.capacity,
                    Tables.locationDescription, Tables.isAvailable,
                ).where { (Tables.id eq tableId) and (Tables.active eq true) }.singleOrNull()
            }
            if (table == null) {
                call.respond(HttpStatusCode.NotFound, ApiError("TABLE_NOT_FOUND", "Table was not found"))
                return@get
            }
            call.respond(
                InternalTableResponse(
                    table[Tables.id].value,
                    table[Tables.restaurantId],
                    table[Tables.tableNumber],
                    table[Tables.capacity],
                    table[Tables.locationDescription],
                    table[Tables.isAvailable],
                ),
            )
        }

        post("/availability/check") {
            val request = call.receive<AvailabilityCheckRequest>()
            val table = transaction {
                Tables.select(Tables.id, Tables.capacity, Tables.isAvailable, Tables.active)
                    .where { Tables.id eq request.tableId }.singleOrNull()
            }
            if (table == null || !table[Tables.active]) {
                call.respond(HttpStatusCode.NotFound, ApiError("TABLE_NOT_FOUND", "Table was not found"))
                return@post
            }
            if (!table[Tables.isAvailable] || table[Tables.capacity] < request.guests) {
                call.respond(AvailabilityCheckResponse(request.tableId, false, "Table not available"))
                return@post
            }
            val conflict = hasTimeConflict(request.tableId, request.bookingDate, request.startTime, request.endTime)
            if (conflict) {
                call.respond(HttpStatusCode.Conflict, ApiError("SLOT_ALREADY_BOOKED", "Table is already booked for requested time"))
                return@post
            }
            call.respond(AvailabilityCheckResponse(request.tableId, true, null))
        }

        post("/availability/reserve") {
            val request = call.receive<ReserveSlotRequest>()
            if (hasTimeConflict(request.tableId, request.bookingDate, request.startTime, request.endTime)) {
                call.respond(HttpStatusCode.Conflict, ApiError("SLOT_ALREADY_BOOKED", "Table is already booked for requested time"))
                return@post
            }
            val existing = transaction {
                TableReservations.select(TableReservations.id).where {
                    TableReservations.bookingId eq request.bookingId
                }.singleOrNull()
            }
            if (existing != null) {
                call.respond(
                    ReserveSlotResponse(existing[TableReservations.id].value, request.bookingId, "reserved"),
                )
                return@post
            }
            val reservationId = transaction {
                TableReservations.insert {
                    it[tableId] = request.tableId
                    it[bookingId] = request.bookingId
                    it[bookingDate] = request.bookingDate
                    it[startTime] = request.startTime
                    it[endTime] = request.endTime
                    it[status] = "reserved"
                    it[createdAt] = LocalDateTime.now().toString()
                } get TableReservations.id
            }
            call.respond(HttpStatusCode.Created, ReserveSlotResponse(reservationId.value, request.bookingId, "reserved"))
        }

        post("/availability/release") {
            val request = call.receive<ReleaseSlotRequest>()
            val updated = transaction {
                TableReservations.update({ TableReservations.bookingId eq request.bookingId }) {
                    it[status] = "released"
                }
            }
            if (updated == 0) {
                call.respond(HttpStatusCode.NotFound, ApiError("RESERVATION_NOT_FOUND", "Reservation was not found"))
                return@post
            }
            call.respond(ReleaseSlotResponse(request.bookingId, "released"))
        }
    }
}

fun handleBookingEvent(eventType: String, bookingId: Int, tableId: Int, bookingDate: String, startTime: String, endTime: String) {
    when (eventType) {
        EventTypes.BOOKING_CREATED -> {
            if (!hasTimeConflict(tableId, bookingDate, startTime, endTime, bookingId)) {
                transaction {
                    val exists = TableReservations.select(TableReservations.id)
                        .where { TableReservations.bookingId eq bookingId }.singleOrNull()
                    if (exists == null) {
                        TableReservations.insert {
                            it[TableReservations.tableId] = tableId
                            it[TableReservations.bookingId] = bookingId
                            it[TableReservations.bookingDate] = bookingDate
                            it[TableReservations.startTime] = startTime
                            it[TableReservations.endTime] = endTime
                            it[status] = "reserved"
                            it[createdAt] = LocalDateTime.now().toString()
                        }
                    }
                }
            }
        }
        EventTypes.BOOKING_CANCELLED -> {
            transaction {
                TableReservations.update({ TableReservations.bookingId eq bookingId }) {
                    it[status] = "released"
                }
            }
        }
    }
}

private fun loadTable(id: Int): TableResponse? = transaction {
    Tables.select(
        Tables.id, Tables.restaurantId, Tables.tableNumber, Tables.capacity,
        Tables.locationDescription, Tables.isAvailable,
    ).where { (Tables.id eq id) and (Tables.active eq true) }.map { it.toTableResponse() }.singleOrNull()
}

private fun org.jetbrains.exposed.sql.ResultRow.toTableResponse() = TableResponse(
    id = this[Tables.id].value,
    restaurantId = this[Tables.restaurantId],
    tableNumber = this[Tables.tableNumber],
    capacity = this[Tables.capacity],
    locationDescription = this[Tables.locationDescription],
    isAvailable = this[Tables.isAvailable],
)
