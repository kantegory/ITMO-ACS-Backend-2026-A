package com.restaurant.restaurant

import com.restaurant.shared.auth.ServiceEnv
import com.restaurant.shared.database.DatabaseFactory
import com.restaurant.shared.events.EventTypes
import com.restaurant.shared.events.RedisEventBus
import com.restaurant.shared.plugins.configureCommonPlugins
import com.restaurant.shared.plugins.configureInternalAuth
import io.ktor.server.application.Application
import io.ktor.server.response.respondText
import io.ktor.server.routing.get
import io.ktor.server.routing.routing
import kotlinx.serialization.json.jsonPrimitive

fun Application.module() {
    configureCommonPlugins()
    configureInternalAuth()
    DatabaseFactory.init(
        ServiceEnv.databaseUrl("jdbc:postgresql://localhost:5432/restaurant_db"),
        Restaurants,
        MenuItems,
    )
    val eventBus = RedisEventBus(ServiceEnv.redisUrl, ServiceEnv.serviceName)
    eventBus.subscribe { event ->
        when (event.type) {
            EventTypes.REVIEW_CREATED, EventTypes.REVIEW_UPDATED, EventTypes.REVIEW_DELETED -> {
                val restaurantId = event.payload["restaurantId"]?.jsonPrimitive?.content?.toIntOrNull() ?: return@subscribe
                val rating = event.payload["averageRating"]?.jsonPrimitive?.content?.toDoubleOrNull() ?: return@subscribe
                val count = event.payload["reviewsCount"]?.jsonPrimitive?.content?.toIntOrNull() ?: return@subscribe
                updateRatingFromFeedback(restaurantId, rating, count)
            }
        }
    }
    routing {
        get("/health") { call.respondText("OK") }
        restaurantPublicRoutes(eventBus)
        restaurantInternalRoutes()
    }
}
