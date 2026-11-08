package com.restaurant.booking

import org.jetbrains.exposed.dao.id.IntIdTable

object Bookings : IntIdTable("bookings") {
    val userId = integer("user_id")
    val restaurantId = integer("restaurant_id")
    val tableId = integer("table_id")
    val bookingDate = varchar("booking_date", 20)
    val startTime = varchar("start_time", 10)
    val endTime = varchar("end_time", 10)
    val numberOfGuests = integer("number_of_guests")
    val specialRequests = text("special_requests").nullable()
    val status = varchar("status", 50).default("pending")
    val active = bool("active").default(true)
    val createdAt = varchar("created_at", 30)
    val updatedAt = varchar("updated_at", 30)
}
