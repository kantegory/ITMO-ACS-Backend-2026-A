package com.restaurant.feedback

import com.restaurant.shared.auth.ServiceEnv
import com.restaurant.shared.database.DatabaseFactory
import com.restaurant.shared.events.EventTypes
import com.restaurant.shared.events.KafkaEventBus
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
        ServiceEnv.databaseUrl("jdbc:postgresql://localhost:5432/feedback_db"),
        Reviews,
    )
    val clients = ServiceClients()
    val eventBus = KafkaEventBus(ServiceEnv.kafkaBootstrapServers, ServiceEnv.serviceName)
    eventBus.subscribe { event ->
        if (event.type == EventTypes.RESTAURANT_DELETED) {
            val restaurantId = event.payload["restaurantId"]?.jsonPrimitive?.content?.toIntOrNull() ?: return@subscribe
            transaction {
                Reviews.update({ Reviews.restaurantId eq restaurantId }) {
                    it[active] = false
                }
            }
        }
    }
    routing {
        get("/health") { call.respondText("OK") }
        feedbackRoutes(clients, eventBus)
    }
}
