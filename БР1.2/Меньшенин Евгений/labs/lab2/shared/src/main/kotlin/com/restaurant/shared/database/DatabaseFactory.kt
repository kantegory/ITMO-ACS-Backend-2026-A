package com.restaurant.shared.database

import org.jetbrains.exposed.sql.Database
import org.jetbrains.exposed.sql.Table
import org.jetbrains.exposed.sql.transactions.transaction

object DatabaseFactory {
    fun init(url: String, vararg tables: Table) {
        val user = System.getenv("DATABASE_USER") ?: "postgres"
        val password = System.getenv("DATABASE_PASSWORD") ?: "postgres"
        val isH2 = url.startsWith("jdbc:h2:")
        val driver = if (isH2) "org.h2.Driver" else "org.postgresql.Driver"
        val dbUser = if (isH2) "sa" else user
        val dbPassword = if (isH2) "" else password
        val effectiveUrl = if (!isH2 && !url.contains("sslmode=")) "$url?sslmode=disable" else url
        Database.connect(url = effectiveUrl, driver = driver, user = dbUser, password = dbPassword)
        transaction {
            org.jetbrains.exposed.sql.SchemaUtils.create(*tables)
        }
    }
}
