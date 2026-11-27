package ru.itmo.restaurantbooking.restaurant.adapter.jdbc

import org.jooq.Configuration
import org.jooq.DSLContext
import org.springframework.stereotype.Component
import ru.itmo.restaurantbooking.jooq.tables.MenuCategories.MENU_CATEGORIES
import ru.itmo.restaurantbooking.jooq.tables.daos.MenuCategoriesDao as JooqMenuCategoriesDao
import ru.itmo.restaurantbooking.jooq.tables.pojos.MenuCategories

@Component
class MenuCategoryDao(
    configuration: Configuration,
    private val dsl: DSLContext
) : JooqMenuCategoriesDao(configuration) {
    fun findByRestaurantId(restaurantId: Long): List<MenuCategories> =
        dsl.selectFrom(MENU_CATEGORIES)
        .where(MENU_CATEGORIES.RESTAURANT_ID.eq(restaurantId))
        .orderBy(MENU_CATEGORIES.SORT_ORDER.asc(), MENU_CATEGORIES.NAME.asc())
        .fetchInto(MenuCategories::class.java)
}
