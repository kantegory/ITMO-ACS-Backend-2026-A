package ru.itmo.restaurantbooking.cuisine.adapter.jdbc

import org.jooq.Configuration
import org.jooq.DSLContext
import org.jooq.SortOrder
import org.springframework.stereotype.Component
import ru.itmo.restaurantbooking.jooq.tables.Cuisines.CUISINES
import ru.itmo.restaurantbooking.jooq.tables.daos.CuisinesDao
import ru.itmo.restaurantbooking.jooq.tables.pojos.Cuisines

@Component
class CuisineDao(
    configuration: Configuration,
    private val dsl: DSLContext
) : CuisinesDao(configuration) {

    fun findAll(search: String?, sortDir: String?): List<Cuisines> {
        val condition = if (search.isNullOrBlank()) CUISINES.ID.isNotNull else CUISINES.NAME.likeIgnoreCase("%${search.trim()}%")
        val order = if (sortDir.equals("desc", ignoreCase = true)) SortOrder.DESC else SortOrder.ASC
        return dsl.selectFrom(CUISINES)
            .where(condition)
            .orderBy(CUISINES.NAME.sort(order))
            .fetchInto(Cuisines::class.java)
    }
}
