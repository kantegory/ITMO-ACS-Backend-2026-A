package com.mezhendosina.routes

import com.mezhendosina.database.Users
import io.ktor.server.application.*
import io.ktor.server.auth.*
import org.jetbrains.exposed.sql.SqlExpressionBuilder.eq
import org.jetbrains.exposed.sql.select
import org.jetbrains.exposed.sql.transactions.transaction

data class UserPrincipal(val userId: Int, val role: String) : Principal

fun ApplicationCall.principalUserId(): Int? {
    return this.principal<UserPrincipal>()?.userId
}

fun ApplicationCall.principalUserRole(): String? {
    val userId = principalUserId() ?: return null
    return transaction {
        Users.select(Users.id eq userId).singleOrNull()?.get(Users.role)
    }
}
