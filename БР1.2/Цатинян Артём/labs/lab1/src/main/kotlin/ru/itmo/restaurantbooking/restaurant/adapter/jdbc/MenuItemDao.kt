package ru.itmo.restaurantbooking.restaurant.adapter.jdbc

import org.jooq.Configuration
import org.jooq.DSLContext
import org.springframework.stereotype.Component
import ru.itmo.restaurantbooking.common.adapter.jdbc.eqIfNotNull
import ru.itmo.restaurantbooking.common.adapter.jdbc.geIfNotNull
import ru.itmo.restaurantbooking.common.adapter.jdbc.leIfNotNull
import ru.itmo.restaurantbooking.common.adapter.jdbc.likeIgnoreCaseIfNotBlank
import ru.itmo.restaurantbooking.jooq.tables.MenuCategories.MENU_CATEGORIES
import ru.itmo.restaurantbooking.jooq.tables.MenuItems.MENU_ITEMS
import ru.itmo.restaurantbooking.jooq.tables.daos.MenuItemsDao as JooqMenuItemsDao
import ru.itmo.restaurantbooking.jooq.tables.pojos.MenuItems
import ru.itmo.restaurantbooking.restaurant.service.RestaurantMenuQuery

@Component
class MenuItemDao(
    configuration: Configuration,
    private val dsl: DSLContext
) : JooqMenuItemsDao(configuration) {
    fun findByRestaurantId(
        restaurantId: Long,
        query: RestaurantMenuQuery
    ) = dsl.select(MENU_ITEMS.fields().toList())
            .from(MENU_ITEMS)
            .join(MENU_CATEGORIES).on(MENU_CATEGORIES.ID.eq(MENU_ITEMS.MENU_CATEGORY_ID))
            .where(
                listOfNotNull(
                    MENU_ITEMS.RESTAURANT_ID.eq(restaurantId),
                    likeIgnoreCaseIfNotBlank(MENU_CATEGORIES.NAME, query.category),
                    likeIgnoreCaseIfNotBlank(MENU_ITEMS.NAME, query.search),
                    eqIfNotNull(MENU_ITEMS.IS_AVAILABLE, query.isAvailable),
                    geIfNotNull(MENU_ITEMS.PRICE_MINOR, query.minPrice),
                    leIfNotNull(MENU_ITEMS.PRICE_MINOR, query.maxPrice)
                )
            )
            .orderBy(MENU_ITEMS.MENU_CATEGORY_ID.asc(), MENU_ITEMS.NAME.asc())
            .fetchInto(MenuItems::class.java)
}
