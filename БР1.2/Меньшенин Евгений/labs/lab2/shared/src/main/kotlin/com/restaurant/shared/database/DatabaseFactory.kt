package com.restaurant.shared.database

import org.jetbrains.exposed.sql.Database
import org.jetbrains.exposed.sql.Table
import org.jetbrains.exposed.sql.transactions.transaction

object DatabaseFactory {
    fun init(url: String, vararg tables: Table) {
        val user = System.getenv("DATABASE_USER") ?: "postgres"
        val password = System.getenv("DATABASE_PASSWORD") ?: "postgres"
        val driver = if (url.startsWith("jdbc:h2:")) "org.h2.Driver" else "org.postgresql.Driver"
        val dbUser = if (driver == "org.h2.Driver") "sa" else user
        val dbPassword = if (driver == "org.h2.Driver") "" else password
        Database.connect(url = url, driver = driver, user = dbUser, password = dbPassword)
        transaction {
            org.jetbrains.exposed.sql.SchemaUtils.create(*tables)
        }
    }
}
