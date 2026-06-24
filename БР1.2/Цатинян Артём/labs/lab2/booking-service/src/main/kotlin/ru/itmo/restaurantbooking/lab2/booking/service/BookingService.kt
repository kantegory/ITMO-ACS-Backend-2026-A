package ru.itmo.restaurantbooking.lab2.booking.service

import org.springframework.stereotype.Service
import ru.itmo.restaurantbooking.lab2.booking.adapter.client.catalog.CatalogClient
import ru.itmo.restaurantbooking.lab2.booking.adapter.jooq.BookingRepository
import ru.itmo.restaurantbooking.lab2.booking.adapter.rest.dto.AvailabilitySlotResponse
import ru.itmo.restaurantbooking.lab2.booking.adapter.rest.dto.BookingResponse
import ru.itmo.restaurantbooking.lab2.booking.adapter.rest.dto.BookingReviewContext
import ru.itmo.restaurantbooking.lab2.booking.adapter.rest.dto.CreateBookingRequest
import ru.itmo.restaurantbooking.lab2.booking.adapter.rest.dto.toResponse
import ru.itmo.restaurantbooking.lab2.common.dto.PageResponse
import ru.itmo.restaurantbooking.lab2.common.exception.BadRequestException
import ru.itmo.restaurantbooking.lab2.common.exception.ConflictException
import ru.itmo.restaurantbooking.lab2.common.exception.NotFoundException
import ru.itmo.restaurantbooking.lab2.common.exception.UnprocessableEntityException
import java.time.LocalDate
import java.time.LocalDateTime

@Service
class BookingService(
    private val bookingRepository: BookingRepository,
    private val catalogClient: CatalogClient
) {
    fun availability(restaurantId: Long, date: LocalDate, guestsCount: Int): List<AvailabilitySlotResponse> {
        val context = catalogClient.availabilityContext(restaurantId, date, guestsCount)
        val hours = context.workingHours ?: return emptyList()
        if (!context.open || hours.opensAt == null || hours.closesAt == null) {
            return emptyList()
        }

        val slots = mutableListOf<AvailabilitySlotResponse>()
        var startsAt = LocalDateTime.of(date, hours.opensAt)
        val closesAt = LocalDateTime.of(date, hours.closesAt)

        while (!startsAt.plusHours(2).isAfter(closesAt)) {
            val endsAt = startsAt.plusHours(2)
            context.tables
                .filter { bookingRepository.isAvailable(it.id, startsAt, endsAt) }
                .forEach { table ->
                    slots += AvailabilitySlotResponse(
                        tableId = table.id,
                        tableNumber = table.tableNumber,
                        startsAt = startsAt,
                        endsAt = endsAt,
                        seatsCount = table.seatsCount
                    )
                }
            startsAt = startsAt.plusHours(1)
        }

        return slots
    }

    fun create(userId: Long, request: CreateBookingRequest): BookingResponse {
        if (!request.endsAt.isAfter(request.startsAt)) {
            throw BadRequestException("endsAt must be after startsAt")
        }

        val context = catalogClient.bookingContext(
            restaurantId = request.restaurantId,
            tableId = request.tableId,
            guestsCount = request.guestsCount,
            startsAt = request.startsAt,
            endsAt = request.endsAt
        )

        if (!bookingRepository.isAvailable(request.tableId, request.startsAt, request.endsAt)) {
            throw ConflictException("This table is already booked for the selected time range")
        }

        return bookingRepository.create(
            userId = userId,
            request = request,
            restaurantNameSnapshot = context.restaurant.name,
            tableNumberSnapshot = context.table.tableNumber,
            tableSeatsSnapshot = context.table.seatsCount
        ).toResponse()
    }

    fun mine(userId: Long, page: Int, size: Int): PageResponse<BookingResponse> {
        val result = bookingRepository.findMine(userId, page, size)
        return PageResponse(
            items = result.items.map { it.toResponse() },
            page = page,
            size = size,
            totalItems = result.totalItems,
            totalPages = if (result.totalItems == 0L) 0 else ((result.totalItems + size - 1) / size).toInt()
        )
    }

    fun byId(userId: Long, bookingId: Long): BookingResponse =
        (bookingRepository.findByIdAndUserId(bookingId, userId)
            ?: throw NotFoundException("Booking not found")).toResponse()

    fun cancel(userId: Long, bookingId: Long): BookingResponse {
        val booking = bookingRepository.findByIdAndUserId(bookingId, userId)
            ?: throw NotFoundException("Booking not found")

        if (booking.startsAt.isBefore(LocalDateTime.now())) {
            throw UnprocessableEntityException("Past bookings cannot be cancelled")
        }

        return bookingRepository.updateStatus(bookingId, "CANCELLED").toResponse()
    }

    fun reviewContext(bookingId: Long, userId: Long, restaurantId: Long): BookingReviewContext {
        val booking = bookingRepository.findByIdAndUserId(bookingId, userId)
            ?: throw NotFoundException("Booking not found")

        if (booking.restaurantId != restaurantId) {
            throw NotFoundException("Booking not found for this restaurant")
        }

        val canReview = booking.status == "COMPLETED" && !booking.endsAt.isAfter(LocalDateTime.now())
        return BookingReviewContext(
            bookingId = booking.id,
            userId = booking.userId,
            restaurantId = booking.restaurantId,
            status = booking.status,
            startsAt = booking.startsAt,
            endsAt = booking.endsAt,
            canReview = canReview,
            denialReason = if (canReview) null else "Booking is not completed yet"
        )
    }
}
