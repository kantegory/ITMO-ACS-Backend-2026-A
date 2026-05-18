package com.restaurant.booking

import com.restaurant.shared.events.EventTypes
import com.restaurant.shared.events.RedisEventBus
import com.restaurant.shared.events.bookingPayload
import com.restaurant.shared.models.ApiError
import com.restaurant.shared.models.AvailabilityCheckRequest
import com.restaurant.shared.models.BookingResponse
import com.restaurant.shared.models.BookingsListResponse
import com.restaurant.shared.models.CreateBookingRequest
import com.restaurant.shared.models.LegacyErrorResponse
import com.restaurant.shared.models.ReserveSlotRequest
import com.restaurant.shared.models.UpdateBookingRequest
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
import io.ktor.server.routing.route
import kotlinx.coroutines.runBlocking
import kotlinx.serialization.json.jsonPrimitive
import org.jetbrains.exposed.sql.SortOrder
import org.jetbrains.exposed.sql.SqlExpressionBuilder.eq
import org.jetbrains.exposed.sql.and
import org.jetbrains.exposed.sql.deleteWhere
import org.jetbrains.exposed.sql.insert
import org.jetbrains.exposed.sql.select
import org.jetbrains.exposed.sql.transactions.transaction
import org.jetbrains.exposed.sql.update
import java.time.LocalDateTime

fun Route.bookingRoutes(clients: ServiceClients, eventBus: RedisEventBus) {
    route("/api/bookings") {
        post {
            val user = call.requireUser() ?: run {
                call.respond(HttpStatusCode.Unauthorized, LegacyErrorResponse("Unauthorized"))
                return@post
            }
            val request = call.receive<CreateBookingRequest>()
            val requestId = call.requestId()

            val result = runBlocking {
                val identityUser = clients.getUser(user.userId, requestId)
                if (identityUser == null || !identityUser.active) {
                    return@runBlocking BookingOpResult.Error(HttpStatusCode.NotFound, LegacyErrorResponse("User not found"))
                }
                val table = clients.getTable(request.tableId, requestId)
                    ?: return@runBlocking BookingOpResult.Error(HttpStatusCode.NotFound, LegacyErrorResponse("Table not found"))
                if (table.capacity < request.guests) {
                    return@runBlocking BookingOpResult.Error(HttpStatusCode.BadRequest, LegacyErrorResponse("Table capacity exceeded"))
                }
                val restaurant = clients.getRestaurant(table.restaurantId, requestId)
                    ?: return@runBlocking BookingOpResult.Error(HttpStatusCode.NotFound, LegacyErrorResponse("Restaurant not found"))
                val check = AvailabilityCheckRequest(
                    request.tableId, request.bookingDate, request.startTime, request.endTime, request.guests,
                )
                val (available, apiError) = clients.checkAvailability(check, requestId)
                if (apiError?.code == "SLOT_ALREADY_BOOKED") {
                    return@runBlocking BookingOpResult.Error(
                        HttpStatusCode.Conflict,
                        LegacyErrorResponse("Table is already booked for this time"),
                    )
                }
                if (!available) {
                    return@runBlocking BookingOpResult.Error(HttpStatusCode.BadRequest, LegacyErrorResponse("Table not available"))
                }

                val bookingId = transaction {
                    Bookings.insert {
                        it[userId] = user.userId
                        it[restaurantId] = table.restaurantId
                        it[tableId] = request.tableId
                        it[bookingDate] = request.bookingDate
                        it[startTime] = request.startTime
                        it[endTime] = request.endTime
                        it[numberOfGuests] = request.guests
                        it[specialRequests] = request.specialRequests
                        it[status] = "pending"
                        it[createdAt] = LocalDateTime.now().toString()
                        it[updatedAt] = LocalDateTime.now().toString()
                    } get Bookings.id
                }

                val reserved = clients.reserve(
                    ReserveSlotRequest(
                        bookingId.value, request.tableId, request.bookingDate,
                        request.startTime, request.endTime,
                    ),
                    requestId,
                )
                if (!reserved) {
                    transaction { Bookings.deleteWhere { Bookings.id eq bookingId } }
                    return@runBlocking BookingOpResult.Error(
                        HttpStatusCode.Conflict,
                        LegacyErrorResponse("Table is already booked for this time"),
                    )
                }

                eventBus.publish(
                    EventTypes.BOOKING_CREATED,
                    bookingPayload(bookingId.value, request.tableId, table.restaurantId, request.bookingDate, request.startTime, request.endTime),
                )

                BookingOpResult.Success(
                    BookingResponse(
                        bookingId.value, user.userId, request.tableId, request.bookingDate,
                        request.startTime, request.endTime, request.guests, request.specialRequests,
                        "pending", table.restaurantId, restaurant.name,
                    ),
                )
            }

            when (result) {
                is BookingOpResult.Success -> call.respond(HttpStatusCode.Created, result.response)
                is BookingOpResult.Error -> call.respond(result.status, result.body)
            }
        }

        get {
            val user = call.requireUser() ?: run {
                call.respond(HttpStatusCode.Unauthorized, LegacyErrorResponse("Unauthorized"))
                return@get
            }
            val bookings = transaction {
                Bookings.select(
                    Bookings.id, Bookings.userId, Bookings.tableId, Bookings.bookingDate,
                    Bookings.startTime, Bookings.endTime, Bookings.numberOfGuests,
                    Bookings.specialRequests, Bookings.status, Bookings.restaurantId,
                ).where { (Bookings.userId eq user.userId) and (Bookings.active eq true) }
                    .orderBy(Bookings.id to SortOrder.DESC)
                    .map { it.toBookingResponse() }
            }
            call.respond(BookingsListResponse(bookings))
        }

        get("/{id}") {
            val user = call.requireUser() ?: run {
                call.respond(HttpStatusCode.Unauthorized, LegacyErrorResponse("Unauthorized"))
                return@get
            }
            val id = call.parameters["id"]?.toIntOrNull() ?: run {
                call.respond(HttpStatusCode.BadRequest, LegacyErrorResponse("Invalid id"))
                return@get
            }
            val booking = transaction {
                Bookings.select(
                    Bookings.id, Bookings.userId, Bookings.tableId, Bookings.bookingDate,
                    Bookings.startTime, Bookings.endTime, Bookings.numberOfGuests,
                    Bookings.specialRequests, Bookings.status, Bookings.restaurantId,
                ).where { (Bookings.id eq id) and (Bookings.userId eq user.userId) and (Bookings.active eq true) }
                    .map { it.toBookingResponse() }.singleOrNull()
            }
            if (booking == null) {
                call.respond(HttpStatusCode.NotFound, LegacyErrorResponse("Booking not found"))
                return@get
            }
            call.respond(booking)
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
            val booking = transaction {
                Bookings.select(
                    Bookings.id, Bookings.userId, Bookings.tableId, Bookings.bookingDate,
                    Bookings.numberOfGuests, Bookings.status,
                ).where { (Bookings.id eq id) and (Bookings.userId eq user.userId) }.singleOrNull()
            }
            if (booking == null) {
                call.respond(HttpStatusCode.NotFound, LegacyErrorResponse("Booking not found"))
                return@patch
            }
            if (booking[Bookings.status] == "confirmed" || booking[Bookings.status] == "cancelled") {
                call.respond(HttpStatusCode.BadRequest, LegacyErrorResponse("Cannot update confirmed or cancelled booking"))
                return@patch
            }
            val request = call.receive<UpdateBookingRequest>()
            transaction {
                Bookings.update({ Bookings.id eq id }) {
                    request.tableId?.let { v -> it[tableId] = v }
                    request.bookingDate?.let { v -> it[bookingDate] = v }
                    request.startTime?.let { v -> it[startTime] = v }
                    request.endTime?.let { v -> it[endTime] = v }
                    request.guests?.let { v -> it[numberOfGuests] = v }
                    request.specialRequests?.let { v -> it[specialRequests] = v }
                    it[updatedAt] = LocalDateTime.now().toString()
                }
            }
            val updated = transaction {
                Bookings.select(
                    Bookings.id, Bookings.userId, Bookings.tableId, Bookings.bookingDate,
                    Bookings.startTime, Bookings.endTime, Bookings.numberOfGuests,
                    Bookings.specialRequests, Bookings.status, Bookings.restaurantId,
                ).where { Bookings.id eq id }.map { it.toBookingResponse() }.single()
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
            val booking = transaction {
                Bookings.select(
                    Bookings.id, Bookings.userId, Bookings.tableId, Bookings.restaurantId,
                    Bookings.bookingDate, Bookings.startTime, Bookings.endTime,
                ).where { (Bookings.id eq id) and (Bookings.userId eq user.userId) }.singleOrNull()
            }
            if (booking == null) {
                call.respond(HttpStatusCode.NotFound, LegacyErrorResponse("Booking not found"))
                return@delete
            }
            transaction {
                Bookings.update({ Bookings.id eq id }) {
                    it[status] = "cancelled"
                    it[updatedAt] = LocalDateTime.now().toString()
                }
            }
            runBlocking {
                clients.release(id, call.requestId())
            }
            eventBus.publish(
                EventTypes.BOOKING_CANCELLED,
                bookingPayload(
                    id, booking[Bookings.tableId], booking[Bookings.restaurantId],
                    booking[Bookings.bookingDate], booking[Bookings.startTime], booking[Bookings.endTime],
                ),
            )
            call.respond(HttpStatusCode.NoContent)
        }
    }
}

private sealed class BookingOpResult {
    data class Success(val response: BookingResponse) : BookingOpResult()
    data class Error(val status: HttpStatusCode, val body: LegacyErrorResponse) : BookingOpResult()
}

private fun org.jetbrains.exposed.sql.ResultRow.toBookingResponse() = BookingResponse(
    id = this[Bookings.id].value,
    userId = this[Bookings.userId],
    tableId = this[Bookings.tableId],
    bookingDate = this[Bookings.bookingDate],
    startTime = this[Bookings.startTime],
    endTime = this[Bookings.endTime],
    numberOfGuests = this[Bookings.numberOfGuests],
    specialRequests = this[Bookings.specialRequests],
    status = this[Bookings.status],
    restaurantId = this[Bookings.restaurantId],
)
