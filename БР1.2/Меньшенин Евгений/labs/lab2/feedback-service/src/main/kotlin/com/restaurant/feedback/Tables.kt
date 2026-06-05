package com.restaurant.feedback

import org.jetbrains.exposed.dao.id.IntIdTable

object Reviews : IntIdTable("reviews") {
    val userId = integer("user_id")
    val restaurantId = integer("restaurant_id")
    val rating = integer("rating")
    val comment = text("comment").nullable()
    val active = bool("active").default(true)
    val createdAt = varchar("created_at", 30)
    val updatedAt = varchar("updated_at", 30)

    init {
        uniqueIndex("idx_reviews_user_restaurant", userId, restaurantId)
    }
}
