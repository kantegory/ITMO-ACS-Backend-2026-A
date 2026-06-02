package com.mezhendosina.database

import org.jetbrains.exposed.sql.Database
import org.jetbrains.exposed.sql.SchemaUtils
import org.jetbrains.exposed.sql.transactions.transaction

object DatabaseFactory {
    fun init() {
        Database.connect(
            url = System.getenv("DATABASE_URL") ?: "jdbc:h2:mem:restaurant;DB_CLOSE_DELAY=-1",
            driver = System.getenv("DATABASE_DRIVER") ?: "org.h2.Driver",
            user = System.getenv("DATABASE_USER") ?: "sa",
            password = System.getenv("DATABASE_PASSWORD") ?: "",
        )
        transaction {
            SchemaUtils.create(Users, Restaurants, Tables, Bookings, MenuItems, Reviews)
        }
    }
}
