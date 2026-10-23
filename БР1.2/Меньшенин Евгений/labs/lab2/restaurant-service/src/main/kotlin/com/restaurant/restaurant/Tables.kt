package com.restaurant.restaurant

import org.jetbrains.exposed.dao.id.IntIdTable

object Restaurants : IntIdTable("restaurants") {
    val name = varchar("name", 300)
    val description = text("description").nullable()
    val address = varchar("address", 500)
    val phoneNumber = varchar("phone_number", 20).nullable()
    val cuisineType = varchar("cuisine_type", 100).nullable()
    val openingTime = varchar("opening_time", 10).nullable()
    val closingTime = varchar("closing_time", 10).nullable()
    val rating = decimal("rating", 2, 1).default(java.math.BigDecimal.ZERO)
    val reviewsCount = integer("reviews_count").default(0)
    val imageUrl = varchar("image_url", 500).nullable()
    val ownerId = integer("owner_id")
    val active = bool("active").default(true)
    val createdAt = varchar("created_at", 30)
    val updatedAt = varchar("updated_at", 30)
}

object MenuItems : IntIdTable("menu_items") {
    val restaurantId = integer("restaurant_id")
    val name = varchar("name", 300)
    val description = text("description").nullable()
    val price = decimal("price", 10, 2)
    val category = varchar("category", 100).nullable()
    val isAvailable = bool("is_available").default(true)
    val createdAt = varchar("created_at", 30)
    val updatedAt = varchar("updated_at", 30)
}
