package com.restaurant.availability

import org.jetbrains.exposed.sql.SqlExpressionBuilder.eq
import org.jetbrains.exposed.sql.and
import org.jetbrains.exposed.sql.or
import org.jetbrains.exposed.sql.select
import org.jetbrains.exposed.sql.transactions.transaction

fun hasTimeConflict(tableId: Int, bookingDate: String, startTime: String, endTime: String, excludeBookingId: Int? = null): Boolean =
    transaction {
        val reservations = TableReservations.select(
            TableReservations.bookingId, TableReservations.startTime, TableReservations.endTime,
        ).where {
            (TableReservations.tableId eq tableId) and
                (TableReservations.bookingDate eq bookingDate) and
                (TableReservations.status eq "reserved")
        }.map { Triple(it[TableReservations.bookingId], it[TableReservations.startTime], it[TableReservations.endTime]) }
            .filter { excludeBookingId == null || it.first != excludeBookingId }

        reservations.any { (_, existingStart, existingEnd) ->
            timesOverlap(startTime, endTime, existingStart, existingEnd)
        }
    }

fun timesOverlap(newStart: String, newEnd: String, existingStart: String, existingEnd: String): Boolean =
    (newStart >= existingStart && newStart < existingEnd) ||
        (newEnd > existingStart && newEnd <= existingEnd) ||
        (newStart <= existingStart && newEnd >= existingEnd)
