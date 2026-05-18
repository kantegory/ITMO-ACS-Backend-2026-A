package com.restaurant.identity

import com.restaurant.shared.auth.ServiceEnv
import com.restaurant.shared.database.DatabaseFactory
import com.restaurant.shared.plugins.configureCommonPlugins
import com.restaurant.shared.plugins.configureInternalAuth
import io.ktor.server.application.Application
import io.ktor.server.application.install
import io.ktor.server.response.respondText
import io.ktor.server.routing.get
import io.ktor.server.routing.routing

fun Application.module() {
    configureCommonPlugins()
    configureInternalAuth()
    DatabaseFactory.init(
        ServiceEnv.databaseUrl("jdbc:postgresql://localhost:5432/auth_db"),
        Users,
    )
    routing {
        get("/health") { call.respondText("OK") }
        publicRoutes()
        internalRoutes()
    }
}
