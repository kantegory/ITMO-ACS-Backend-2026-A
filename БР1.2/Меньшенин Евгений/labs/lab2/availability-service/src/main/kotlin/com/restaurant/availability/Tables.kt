package com.restaurant.availability

import org.jetbrains.exposed.dao.id.IntIdTable

object Tables : IntIdTable("tables") {
    val restaurantId = integer("restaurant_id")
    val tableNumber = integer("table_number")
    val capacity = integer("capacity")
    val locationDescription = text("location_description").nullable()
    val isAvailable = bool("is_available").default(true)
    val active = bool("active").default(true)
    val createdAt = varchar("created_at", 30)
    val updatedAt = varchar("updated_at", 30)

    init {
        uniqueIndex("idx_tables_restaurant_number", restaurantId, tableNumber)
    }
}

object TableReservations : IntIdTable("table_reservations") {
    val tableId = integer("table_id")
    val bookingId = integer("booking_id")
    val bookingDate = varchar("booking_date", 20)
    val startTime = varchar("start_time", 10)
    val endTime = varchar("end_time", 10)
    val status = varchar("status", 50).default("reserved")
    val createdAt = varchar("created_at", 30)
}
