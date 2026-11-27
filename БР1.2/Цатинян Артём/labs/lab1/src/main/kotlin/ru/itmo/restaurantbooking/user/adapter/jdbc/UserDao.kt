package ru.itmo.restaurantbooking.user.adapter.jdbc

import org.jooq.Configuration
import org.jooq.DSLContext
import org.springframework.stereotype.Component
import ru.itmo.restaurantbooking.jooq.tables.Users.USERS
import ru.itmo.restaurantbooking.jooq.tables.daos.UsersDao
import ru.itmo.restaurantbooking.jooq.tables.pojos.Users

@Component
class UserDao(
    configuration: Configuration,
    private val dsl: DSLContext
) : UsersDao(configuration) {
    fun insertReturning(user: Users): Users =
        dsl.insertInto(USERS)
            .set(dsl.newRecord(USERS, user))
            .returning()
            .fetchOneInto(Users::class.java)
            ?: error("Failed to insert user")

    fun findByEmail(email: String): Users? = dsl.selectFrom(USERS)
        .where(USERS.EMAIL.eq(email))
        .fetchOneInto(Users::class.java)

    fun findActiveById(id: Long): Users? = dsl.selectFrom(USERS)
        .where(USERS.ID.eq(id).and(USERS.IS_ACTIVE.isTrue))
        .fetchOneInto(Users::class.java)

    fun findAnyById(id: Long): Users? = dsl.selectFrom(USERS)
        .where(USERS.ID.eq(id))
        .fetchOneInto(Users::class.java)

    fun hasAnyAdmin(): Boolean = dsl.fetchExists(
        dsl.selectOne().from(USERS).where(USERS.ROLE.eq(ru.itmo.restaurantbooking.user.domain.UserRole.ADMIN))
    )
}
