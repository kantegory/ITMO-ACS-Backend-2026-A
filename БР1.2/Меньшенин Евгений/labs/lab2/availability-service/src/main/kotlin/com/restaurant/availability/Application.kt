package com.restaurant.availability

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
import org.jetbrains.exposed.sql.SqlExpressionBuilder.eq
import org.jetbrains.exposed.sql.transactions.transaction
import org.jetbrains.exposed.sql.update

fun Application.module() {
    configureCommonPlugins()
    configureInternalAuth()
    DatabaseFactory.init(
        ServiceEnv.databaseUrl("jdbc:postgresql://localhost:5432/availability_db"),
        Tables,
        TableReservations,
    )
    val restaurantClient = RestaurantClient()
    val eventBus = RedisEventBus(ServiceEnv.redisUrl, ServiceEnv.serviceName)
    eventBus.subscribe { event ->
        when (event.type) {
            EventTypes.BOOKING_CREATED, EventTypes.BOOKING_CANCELLED -> {
                val bookingId = event.payload["bookingId"]?.jsonPrimitive?.content?.toIntOrNull() ?: return@subscribe
                val tableId = event.payload["tableId"]?.jsonPrimitive?.content?.toIntOrNull() ?: return@subscribe
                val bookingDate = event.payload["bookingDate"]?.jsonPrimitive?.content ?: return@subscribe
                val startTime = event.payload["startTime"]?.jsonPrimitive?.content ?: return@subscribe
                val endTime = event.payload["endTime"]?.jsonPrimitive?.content ?: return@subscribe
                handleBookingEvent(event.type, bookingId, tableId, bookingDate, startTime, endTime)
            }
            EventTypes.RESTAURANT_DELETED -> {
                val restaurantId = event.payload["restaurantId"]?.jsonPrimitive?.content?.toIntOrNull() ?: return@subscribe
                transaction {
                    Tables.update({ Tables.restaurantId eq restaurantId }) {
                        it[active] = false
                    }
                }
            }
        }
    }
    routing {
        get("/health") { call.respondText("OK") }
        availabilityPublicRoutes(restaurantClient)
        availabilityInternalRoutes()
    }
}
