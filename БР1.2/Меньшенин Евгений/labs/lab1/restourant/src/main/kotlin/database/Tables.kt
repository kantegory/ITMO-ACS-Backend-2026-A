package com.mezhendosina.database

import org.jetbrains.exposed.dao.id.IntIdTable

object Users : IntIdTable("users") {
    val email = varchar("email", 300).uniqueIndex()
    val firstName = varchar("first_name", 300)
    val lastName = varchar("last_name", 300)
    val phoneNumber = varchar("phone_number", 20).nullable()
    val role = varchar("role", 50).default("client")
    val password = varchar("password", 150)
    val createdAt = varchar("created_at", 30)
    val updatedAt = varchar("updated_at", 30)
}

object Restaurants : IntIdTable("restaurants") {
    val name = varchar("name", 300)
    val description = text("description").nullable()
    val address = varchar("address", 500)
    val phoneNumber = varchar("phone_number", 20).nullable()
    val cuisineType = varchar("cuisine_type", 100).nullable().index("idx_restaurants_cuisine_type")
    val openingTime = varchar("opening_time", 10).nullable()
    val closingTime = varchar("closing_time", 10).nullable()
    val rating = decimal("rating", 2, 1).default(java.math.BigDecimal.ZERO).index("idx_restaurants_rating")
    val imageUrl = varchar("image_url", 500).nullable()
    val ownerId = integer("owner_id").references(Users.id).index("idx_restaurants_owner_id")
    val createdAt = varchar("created_at", 30)
    val updatedAt = varchar("updated_at", 30)
}

object Tables : IntIdTable("tables") {
    val restaurantId = integer("restaurant_id").references(Restaurants.id).index("idx_tables_restaurant_id")
    val tableNumber = integer("table_number")
    val capacity = integer("capacity")
    val locationDescription = text("location_description").nullable()
    val isAvailable = bool("is_available").default(true)
    val createdAt = varchar("created_at", 30)
    val updatedAt = varchar("updated_at", 30)
}

object Bookings : IntIdTable("bookings") {
    val userId = integer("user_id").references(Users.id).index("idx_bookings_user_id")
    val tableId = integer("table_id").references(Tables.id).index("idx_bookings_table_id")
    val bookingDate = varchar("booking_date", 20)
    val startTime = varchar("start_time", 10)
    val endTime = varchar("end_time", 10)
    val numberOfGuests = integer("number_of_guests")
    val specialRequests = text("special_requests").nullable()
    val status = varchar("status", 50).default("pending")
    val createdAt = varchar("created_at", 30)
    val updatedAt = varchar("updated_at", 30)

    init {
        // Composite index for conflict-check query: tableId + bookingDate + status
        index("idx_bookings_table_date_status", false, tableId, bookingDate, status)
    }
}

object MenuItems : IntIdTable("menu_items") {
    val restaurantId = integer("restaurant_id").references(Restaurants.id).index("idx_menu_items_restaurant_id")
    val name = varchar("name", 300)
    val description = text("description").nullable()
    val price = decimal("price", 10, 2)
    val category = varchar("category", 100).nullable()
    val isAvailable = bool("is_available").default(true)
    val createdAt = varchar("created_at", 30)
    val updatedAt = varchar("updated_at", 30)

    init {
        // Composite index for menu listing: restaurantId + isAvailable
        index("idx_menu_items_restaurant_available", false, restaurantId, isAvailable)
    }
}

object Reviews : IntIdTable("reviews") {
    val userId = integer("user_id").references(Users.id)
    val restaurantId = integer("restaurant_id").references(Restaurants.id).index("idx_reviews_restaurant_id")
    val rating = integer("rating")
    val comment = text("comment").nullable()
    val createdAt = varchar("created_at", 30)
    val updatedAt = varchar("updated_at", 30)

    init {
        // Unique composite index: one review per user per restaurant
        uniqueIndex("idx_reviews_user_restaurant", userId, restaurantId)
    }
}
