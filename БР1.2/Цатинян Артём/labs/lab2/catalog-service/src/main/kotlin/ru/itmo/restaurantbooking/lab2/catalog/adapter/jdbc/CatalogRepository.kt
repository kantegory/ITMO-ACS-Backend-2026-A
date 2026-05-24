package ru.itmo.restaurantbooking.lab2.catalog.adapter.jdbc

import org.springframework.jdbc.core.namedparam.MapSqlParameterSource
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate
import org.springframework.stereotype.Repository
import ru.itmo.restaurantbooking.lab2.catalog.adapter.rest.dto.AvailabilityContextResponse
import ru.itmo.restaurantbooking.lab2.catalog.adapter.rest.dto.CuisineResponse
import ru.itmo.restaurantbooking.lab2.catalog.adapter.rest.dto.MenuCategoryResponse
import ru.itmo.restaurantbooking.lab2.catalog.adapter.rest.dto.MenuCategoryRow
import ru.itmo.restaurantbooking.lab2.catalog.adapter.rest.dto.MenuItemResponse
import ru.itmo.restaurantbooking.lab2.catalog.adapter.rest.dto.RestaurantBookingContext
import ru.itmo.restaurantbooking.lab2.catalog.adapter.rest.dto.RestaurantDetailsResponse
import ru.itmo.restaurantbooking.lab2.catalog.adapter.rest.dto.RestaurantSearchQuery
import ru.itmo.restaurantbooking.lab2.catalog.adapter.rest.dto.RestaurantSummaryResponse
import ru.itmo.restaurantbooking.lab2.catalog.adapter.rest.dto.TableContextResponse
import ru.itmo.restaurantbooking.lab2.catalog.adapter.rest.dto.WorkingHoursResponse
import ru.itmo.restaurantbooking.lab2.common.dto.PageResponse
import ru.itmo.restaurantbooking.lab2.common.exception.NotFoundException
import java.sql.ResultSet
import java.time.LocalDate

@Repository
class CatalogRepository(
    private val jdbc: NamedParameterJdbcTemplate
) {
    fun findCuisines(search: String?): List<CuisineResponse> =
        jdbc.query(
            """
            select id, name
            from cuisines
            where :search is null or lower(name) like lower(concat('%', :search, '%'))
            order by name
            """.trimIndent(),
            mapOf("search" to search?.takeIf { it.isNotBlank() })
        ) { rs, _ -> CuisineResponse(rs.getLong("id"), rs.getString("name")) }

    fun searchRestaurants(query: RestaurantSearchQuery): PageResponse<RestaurantSummaryResponse> {
        val params = MapSqlParameterSource()
            .addValue("search", query.search?.takeIf { it.isNotBlank() })
            .addValue("cuisine", query.cuisine?.takeIf { it.isNotBlank() })
            .addValue("city", query.city?.takeIf { it.isNotBlank() })
            .addValue("priceSegment", query.priceSegment?.takeIf { it.isNotBlank() })
            .addValue("limit", query.size)
            .addValue("offset", (query.page - 1) * query.size)

        val whereSql = """
            r.is_active = true
            and (:search is null or lower(r.name) like lower(concat('%', :search, '%')))
            and (:city is null or lower(r.city) like lower(concat('%', :city, '%')))
            and (:priceSegment is null or r.price_segment = :priceSegment)
            and (:cuisine is null or exists (
                select 1
                from restaurant_cuisines rc
                join cuisines c on c.id = rc.cuisine_id
                where rc.restaurant_id = r.id and lower(c.name) like lower(concat('%', :cuisine, '%'))
            ))
        """.trimIndent()

        val items = jdbc.query(
            """
            select r.id, r.name, r.description, r.city, r.street, r.building, r.phone,
                   r.price_segment, coalesce(s.average_rating, 0) as average_rating,
                   coalesce(s.review_count, 0) as review_count
            from restaurants r
            left join restaurant_rating_stats s on s.restaurant_id = r.id
            where $whereSql
            order by average_rating desc, r.name asc
            limit :limit offset :offset
            """.trimIndent(),
            params
        ) { rs, _ -> rs.toRestaurantSummary() }

        val total = jdbc.queryForObject(
            "select count(*) from restaurants r where $whereSql",
            params,
            Long::class.java
        ) ?: 0L

        return PageResponse(
            items = items,
            page = query.page,
            size = query.size,
            totalItems = total,
            totalPages = if (total == 0L) 0 else ((total + query.size - 1) / query.size).toInt()
        )
    }

    fun restaurantSummary(restaurantId: Long): RestaurantSummaryResponse =
        jdbc.query(
            """
            select r.id, r.name, r.description, r.city, r.street, r.building, r.phone,
                   r.price_segment, coalesce(s.average_rating, 0) as average_rating,
                   coalesce(s.review_count, 0) as review_count
            from restaurants r
            left join restaurant_rating_stats s on s.restaurant_id = r.id
            where r.id = :restaurantId and r.is_active = true
            """.trimIndent(),
            mapOf("restaurantId" to restaurantId)
        ) { rs, _ -> rs.toRestaurantSummary() }.firstOrNull()
            ?: throw NotFoundException("Restaurant not found")

    fun restaurantDetails(restaurantId: Long): RestaurantDetailsResponse {
        val summary = restaurantSummary(restaurantId)
        return RestaurantDetailsResponse(
            id = summary.id,
            name = summary.name,
            description = summary.description,
            city = summary.city,
            street = summary.street,
            building = summary.building,
            phone = summary.phone,
            priceSegment = summary.priceSegment,
            cuisines = cuisineNames(restaurantId),
            workingHours = workingHours(restaurantId),
            rating = summary.rating,
            reviewCount = summary.reviewCount
        )
    }

    fun menu(restaurantId: Long, category: String?, search: String?): List<MenuCategoryResponse> {
        restaurantSummary(restaurantId)

        val categories = jdbc.query(
            """
            select id, name, sort_order
            from menu_categories
            where restaurant_id = :restaurantId
              and (:category is null or lower(name) like lower(concat('%', :category, '%')))
            order by sort_order, name
            """.trimIndent(),
            mapOf("restaurantId" to restaurantId, "category" to category?.takeIf { it.isNotBlank() })
        ) { rs, _ -> MenuCategoryRow(rs.getLong("id"), rs.getString("name"), rs.getInt("sort_order")) }

        val items = jdbc.query(
            """
            select id, menu_category_id, name, description, price_minor, currency_code, is_available
            from menu_items
            where restaurant_id = :restaurantId
              and is_available = true
              and (:search is null or lower(name) like lower(concat('%', :search, '%')))
            order by name
            """.trimIndent(),
            mapOf("restaurantId" to restaurantId, "search" to search?.takeIf { it.isNotBlank() })
        ) { rs, _ -> rs.toMenuItem() }.groupBy { it.menuCategoryId }

        return categories.map {
            MenuCategoryResponse(it.id, it.name, it.sortOrder, items[it.id].orEmpty())
        }.filter { it.items.isNotEmpty() || search.isNullOrBlank() }
    }

    fun bookingContext(restaurantId: Long, tableId: Long, date: LocalDate): RestaurantBookingContext {
        val restaurant = restaurantSummary(restaurantId)
        val table = jdbc.query(
            """
            select id, restaurant_id, table_number, seats_count, zone_name, is_active
            from restaurant_tables
            where id = :tableId and restaurant_id = :restaurantId and is_active = true
            """.trimIndent(),
            mapOf("tableId" to tableId, "restaurantId" to restaurantId)
        ) { rs, _ -> rs.toTableContext() }.firstOrNull()
            ?: throw NotFoundException("Table not found")

        return RestaurantBookingContext(
            restaurant = restaurant,
            table = table,
            workingHours = workingHours(restaurantId).firstOrNull { it.weekDay == date.dayOfWeek.value },
            withinWorkingHours = false
        )
    }

    fun availabilityContext(restaurantId: Long, date: LocalDate, guestsCount: Int): AvailabilityContextResponse {
        restaurantSummary(restaurantId)
        val hours = workingHours(restaurantId).firstOrNull { it.weekDay == date.dayOfWeek.value }
        val tables = jdbc.query(
            """
            select id, restaurant_id, table_number, seats_count, zone_name, is_active
            from restaurant_tables
            where restaurant_id = :restaurantId and seats_count >= :guestsCount and is_active = true
            order by seats_count, table_number
            """.trimIndent(),
            mapOf("restaurantId" to restaurantId, "guestsCount" to guestsCount)
        ) { rs, _ -> rs.toTableContext() }

        return AvailabilityContextResponse(restaurantId, date, hours?.closed == false, hours, tables)
    }

    private fun cuisineNames(restaurantId: Long): List<String> =
        jdbc.query(
            """
            select c.name
            from restaurant_cuisines rc
            join cuisines c on c.id = rc.cuisine_id
            where rc.restaurant_id = :restaurantId
            order by c.name
            """.trimIndent(),
            mapOf("restaurantId" to restaurantId)
        ) { rs, _ -> rs.getString("name") }

    private fun workingHours(restaurantId: Long): List<WorkingHoursResponse> =
        jdbc.query(
            """
            select week_day, opens_at, closes_at, is_closed
            from restaurant_working_hours
            where restaurant_id = :restaurantId
            order by week_day
            """.trimIndent(),
            mapOf("restaurantId" to restaurantId)
        ) { rs, _ ->
            WorkingHoursResponse(
                weekDay = rs.getInt("week_day"),
                opensAt = rs.getTime("opens_at")?.toLocalTime(),
                closesAt = rs.getTime("closes_at")?.toLocalTime(),
                closed = rs.getBoolean("is_closed")
            )
        }
}

private fun ResultSet.toRestaurantSummary() =
    RestaurantSummaryResponse(
        id = getLong("id"),
        name = getString("name"),
        description = getString("description"),
        city = getString("city"),
        street = getString("street"),
        building = getString("building"),
        phone = getString("phone"),
        priceSegment = getString("price_segment"),
        rating = getBigDecimal("average_rating"),
        reviewCount = getInt("review_count")
    )

private fun ResultSet.toTableContext() =
    TableContextResponse(
        id = getLong("id"),
        restaurantId = getLong("restaurant_id"),
        tableNumber = getString("table_number"),
        seatsCount = getInt("seats_count"),
        zoneName = getString("zone_name"),
        active = getBoolean("is_active")
    )

private fun ResultSet.toMenuItem() =
    MenuItemResponse(
        id = getLong("id"),
        menuCategoryId = getLong("menu_category_id"),
        name = getString("name"),
        description = getString("description"),
        priceMinor = getInt("price_minor"),
        currencyCode = getString("currency_code"),
        available = getBoolean("is_available")
    )
