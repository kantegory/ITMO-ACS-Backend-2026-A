package ru.itmo.restaurantbooking.booking.service

import org.springframework.stereotype.Service
import ru.itmo.restaurantbooking.booking.adapter.jdbc.BookingDao
import ru.itmo.restaurantbooking.booking.adapter.rest.dto.BookingResponse
import ru.itmo.restaurantbooking.booking.adapter.rest.dto.CreateBookingRequest
import ru.itmo.restaurantbooking.booking.adapter.rest.mapper.BookingMapper
import ru.itmo.restaurantbooking.booking.domain.BookingStatus
import ru.itmo.restaurantbooking.common.adapter.rest.dto.PageResponse
import ru.itmo.restaurantbooking.common.exception.BadRequestException
import ru.itmo.restaurantbooking.common.exception.ConflictException
import ru.itmo.restaurantbooking.common.exception.NotFoundException
import ru.itmo.restaurantbooking.jooq.tables.pojos.Bookings
import ru.itmo.restaurantbooking.restaurant.adapter.jdbc.RestaurantDao
import ru.itmo.restaurantbooking.restaurant.adapter.jdbc.RestaurantTableDao
import java.time.LocalDateTime

@Service
class BookingService(
    private val bookingDao: BookingDao,
    private val restaurantDao: RestaurantDao,
    private val restaurantTableDao: RestaurantTableDao,
    private val bookingMapper: BookingMapper
) {
    fun create(
        userId: Long,
        request: CreateBookingRequest
    ): BookingResponse {
        val restaurant = restaurantDao.findActiveById(request.restaurantId)
            ?: throw NotFoundException("Restaurant not found")
        val table = restaurantTableDao.findActiveById(request.tableId)
            ?: throw NotFoundException("Table not found")

        if (table.restaurantId != restaurant.id) {
            throw BadRequestException("Table does not belong to the selected restaurant")
        }

        if (table.seatsCount < request.guestsCount) {
            throw ConflictException("Table does not have enough seats")
        }

        if (bookingDao.hasOverlappingBooking(table.id, request.startsAt, request.endsAt)) {
            throw ConflictException("This table is already booked for the selected time range")
        }

        val booking = Bookings()
            .setUserId(userId)
            .setRestaurantId(restaurant.id)
            .setTableId(table.id)
            .setStatus(BookingStatus.CONFIRMED)
            .setGuestsCount(request.guestsCount)
            .setStartsAt(request.startsAt)
            .setEndsAt(request.endsAt)
            .setSpecialRequests(request.specialRequests)
            .setCreatedAt(LocalDateTime.now())

        val createdBooking = bookingDao.insertReturning(booking)

        return toResponse(
            booking = createdBooking,
            restaurant = restaurant,
            table = table
        )
    }

    fun getMine(
        userId: Long,
        query: BookingSearchQuery
    ): PageResponse<BookingResponse> {
        val result = bookingDao.findUserBookings(userId, query)
        val restaurants = restaurantDao.findByIds(result.items.map { it.restaurantId }.distinct())
            .associateBy { it.id }
        val tables = result.items.mapNotNull { restaurantTableDao.findActiveById(it.tableId) }
            .associateBy { it.id }

        val items = result.items.mapNotNull { booking ->
            val restaurant = restaurants[booking.restaurantId] ?: return@mapNotNull null
            val table = tables[booking.tableId] ?: return@mapNotNull null

            toResponse(
                booking = booking,
                restaurant = restaurant,
                table = table
            )
        }

        return PageResponse(
            items = items,
            page = query.page,
            size = query.size,
            totalItems = result.totalItems,
            totalPages = result.totalPages(query.size)
        )
    }

    fun getById(
        userId: Long,
        bookingId: Long
    ): BookingResponse {
        val booking = bookingDao.findByIdAndUserId(bookingId, userId)
            ?: throw NotFoundException("Booking not found")
        val restaurant = restaurantDao.findActiveById(booking.restaurantId)
            ?: throw NotFoundException("Restaurant not found")
        val table = restaurantTableDao.findActiveById(booking.tableId)
            ?: throw NotFoundException("Table not found")

        return toResponse(
            booking = booking,
            restaurant = restaurant,
            table = table
        )
    }

    fun cancel(
        userId: Long,
        bookingId: Long
    ): BookingResponse {
        val booking = bookingDao.findByIdAndUserId(bookingId, userId)
            ?: throw NotFoundException("Booking not found")

        if (booking.startsAt.isBefore(LocalDateTime.now())) {
            throw BadRequestException("Past bookings cannot be cancelled")
        }

        booking.status = BookingStatus.CANCELLED
        bookingDao.update(booking)

        val restaurant = restaurantDao.findActiveById(booking.restaurantId)
            ?: throw NotFoundException("Restaurant not found")
        val table = restaurantTableDao.findActiveById(booking.tableId)
            ?: throw NotFoundException("Table not found")

        return toResponse(
            booking = booking,
            restaurant = restaurant,
            table = table
        )
    }

    fun requireUserBooking(
        userId: Long,
        bookingId: Long
    ) =
        bookingDao.findByIdAndUserId(bookingId, userId)
            ?: throw NotFoundException("Booking not found")

    private fun toResponse(
        booking: Bookings,
        restaurant: ru.itmo.restaurantbooking.jooq.tables.pojos.Restaurants,
        table: ru.itmo.restaurantbooking.jooq.tables.pojos.RestaurantTables
    ) =
        BookingResponse(
            id = booking.id,
            status = booking.status.name,
            guestsCount = booking.guestsCount,
            startsAt = booking.startsAt,
            endsAt = booking.endsAt,
            specialRequests = booking.specialRequests,
            createdAt = booking.createdAt,
            restaurant = bookingMapper.toRestaurantResponse(restaurant),
            table = bookingMapper.toTableResponse(table)
        )
}
