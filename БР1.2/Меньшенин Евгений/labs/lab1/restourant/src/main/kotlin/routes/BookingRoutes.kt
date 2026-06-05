package com.mezhendosina.routes

import com.mezhendosina.database.*
import com.mezhendosina.database.Bookings
import com.mezhendosina.database.Restaurants
import com.mezhendosina.database.Tables
import io.ktor.http.*
import io.ktor.server.auth.*
import io.ktor.server.request.*
import io.ktor.server.response.*
import io.ktor.server.routing.*
import org.jetbrains.exposed.sql.and
import org.jetbrains.exposed.sql.SortOrder
import org.jetbrains.exposed.sql.insert
import org.jetbrains.exposed.sql.select
import org.jetbrains.exposed.sql.transactions.transaction
import org.jetbrains.exposed.sql.update
import java.time.LocalDateTime

fun Route.bookingRoutes() {
    route("/bookings") {
        authenticate("auth-jwt") {
            post {
                val userId = call.principalUserId()!!
                val request = call.receive<CreateBookingRequest>()

                val table = transaction {
                    Tables.select(
                        Tables.id, Tables.restaurantId, Tables.capacity,
                    ).where { Tables.id eq request.tableId }.singleOrNull()
                }

                if (table == null) {
                    call.respond(HttpStatusCode.NotFound, ErrorResponse("Table not found"))
                    return@post
                }

                if (table[Tables.capacity] < request.guests) {
                    call.respond(HttpStatusCode.BadRequest, ErrorResponse("Table capacity exceeded"))
                    return@post
                }

                val existingBookings = transaction {
                    Bookings.select(Bookings.startTime, Bookings.endTime).where {
                        (Bookings.tableId eq request.tableId) and
                        (Bookings.bookingDate eq request.bookingDate) and
                        (Bookings.status eq "confirmed")
                    }.map { Pair(it[Bookings.startTime], it[Bookings.endTime]) }
                }

                val hasConflict = existingBookings.any { (existingStart, existingEnd) ->
                    val newStart = request.startTime
                    val newEnd = request.endTime
                    (newStart >= existingStart && newStart < existingEnd) ||
                    (newEnd > existingStart && newEnd <= existingEnd) ||
                    (newStart <= existingStart && newEnd >= existingEnd)
                }

                if (hasConflict) {
                    call.respond(HttpStatusCode.Conflict, ErrorResponse("Table is already booked for this time"))
                    return@post
                }

                val restaurant = transaction {
                    Restaurants.select(Restaurants.id, Restaurants.name)
                        .where { Restaurants.id eq table[Tables.restaurantId] }
                        .singleOrNull()
                }

                val id = transaction {
                    Bookings.insert {
                        it[Bookings.userId] = userId
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

                call.respond(
                    HttpStatusCode.Created,
                    BookingResponse(
                        id = id.value,
                        userId = userId,
                        tableId = request.tableId,
                        bookingDate = request.bookingDate,
                        startTime = request.startTime,
                        endTime = request.endTime,
                        numberOfGuests = request.guests,
                        specialRequests = request.specialRequests,
                        status = "pending",
                        restaurantId = restaurant?.get(Restaurants.id)?.value,
                        restaurantName = restaurant?.get(Restaurants.name),
                    )
                )
            }

            get {
                val userId = call.principalUserId()!!

                val bookings = transaction {
                    Bookings.select(
                        Bookings.id, Bookings.userId, Bookings.tableId,
                        Bookings.bookingDate, Bookings.startTime, Bookings.endTime,
                        Bookings.numberOfGuests, Bookings.specialRequests, Bookings.status,
                    ).where { Bookings.userId eq userId }
                        .orderBy(Bookings.id to SortOrder.DESC)
                        .map { row ->
                            BookingResponse(
                                id = row[Bookings.id].value,
                                userId = row[Bookings.userId],
                                tableId = row[Bookings.tableId],
                                bookingDate = row[Bookings.bookingDate],
                                startTime = row[Bookings.startTime],
                                endTime = row[Bookings.endTime],
                                numberOfGuests = row[Bookings.numberOfGuests],
                                specialRequests = row[Bookings.specialRequests],
                                status = row[Bookings.status],
                            )
                        }
                }

                call.respond(BookingsListResponse(bookings = bookings))
            }

            get("/{id}") {
                val userId = call.principalUserId()!!
                val id = call.parameters["id"]?.toIntOrNull() ?: run {
                    call.respond(HttpStatusCode.BadRequest, ErrorResponse("Invalid id"))
                    return@get
                }

                val booking = transaction {
                    Bookings.select(
                        Bookings.id, Bookings.userId, Bookings.tableId,
                        Bookings.bookingDate, Bookings.startTime, Bookings.endTime,
                        Bookings.numberOfGuests, Bookings.specialRequests, Bookings.status,
                    ).where {
                        (Bookings.id eq id) and (Bookings.userId eq userId)
                    }.map { row ->
                        BookingResponse(
                            id = row[Bookings.id].value,
                            userId = row[Bookings.userId],
                            tableId = row[Bookings.tableId],
                            bookingDate = row[Bookings.bookingDate],
                            startTime = row[Bookings.startTime],
                            endTime = row[Bookings.endTime],
                            numberOfGuests = row[Bookings.numberOfGuests],
                            specialRequests = row[Bookings.specialRequests],
                            status = row[Bookings.status],
                        )
                    }.singleOrNull()
                }

                if (booking == null) {
                    call.respond(HttpStatusCode.NotFound, ErrorResponse("Booking not found"))
                    return@get
                }

                call.respond(booking)
            }

            patch("/{id}") {
                val userId = call.principalUserId()!!
                val id = call.parameters["id"]?.toIntOrNull() ?: run {
                    call.respond(HttpStatusCode.BadRequest, ErrorResponse("Invalid id"))
                    return@patch
                }

                val booking = transaction {
                    Bookings.select(
                        Bookings.id, Bookings.userId, Bookings.tableId,
                        Bookings.bookingDate, Bookings.numberOfGuests, Bookings.status,
                    ).where {
                        (Bookings.id eq id) and (Bookings.userId eq userId)
                    }.singleOrNull()
                }

                if (booking == null) {
                    call.respond(HttpStatusCode.NotFound, ErrorResponse("Booking not found"))
                    return@patch
                }

                val currentStatus = booking[Bookings.status]
                if (currentStatus == "confirmed" || currentStatus == "cancelled") {
                    call.respond(HttpStatusCode.BadRequest, ErrorResponse("Cannot update confirmed or cancelled booking"))
                    return@patch
                }

                val request = call.receive<UpdateBookingRequest>()

                if (request.tableId != null && request.tableId != booking[Bookings.tableId]) {
                    val tbl = transaction {
                        Tables.select(Tables.id, Tables.capacity)
                            .where { Tables.id eq request.tableId }
                            .singleOrNull()
                    }
                    if (tbl == null || tbl[Tables.capacity] < (request.guests ?: booking[Bookings.numberOfGuests])) {
                        call.respond(HttpStatusCode.BadRequest, ErrorResponse("Invalid table"))
                        return@patch
                    }
                }

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
                        Bookings.id, Bookings.userId, Bookings.tableId,
                        Bookings.bookingDate, Bookings.startTime, Bookings.endTime,
                        Bookings.numberOfGuests, Bookings.specialRequests, Bookings.status,
                    ).where { Bookings.id eq id }.map { row ->
                        BookingResponse(
                            id = row[Bookings.id].value,
                            userId = row[Bookings.userId],
                            tableId = row[Bookings.tableId],
                            bookingDate = row[Bookings.bookingDate],
                            startTime = row[Bookings.startTime],
                            endTime = row[Bookings.endTime],
                            numberOfGuests = row[Bookings.numberOfGuests],
                            specialRequests = row[Bookings.specialRequests],
                            status = row[Bookings.status],
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

                val booking = transaction {
                    Bookings.select(Bookings.id, Bookings.userId)
                        .where {
                            (Bookings.id eq id) and (Bookings.userId eq userId)
                        }.singleOrNull()
                }

                if (booking == null) {
                    call.respond(HttpStatusCode.NotFound, ErrorResponse("Booking not found"))
                    return@delete
                }

                transaction {
                    Bookings.update({ Bookings.id eq id }) {
                        it[status] = "cancelled"
                        it[updatedAt] = LocalDateTime.now().toString()
                    }
                }

                call.respond(HttpStatusCode.NoContent)
            }
        }
    }
}
