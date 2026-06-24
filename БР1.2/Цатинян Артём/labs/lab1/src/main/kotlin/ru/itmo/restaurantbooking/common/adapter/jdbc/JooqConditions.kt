package ru.itmo.restaurantbooking.common.adapter.jdbc

import org.jooq.Condition
import org.jooq.Field

fun likeIgnoreCaseIfNotBlank(field: Field<String>, value: String?): Condition? {
    val normalized = value?.trim()?.takeIf(String::isNotEmpty) ?: return null

    return field.likeIgnoreCase("%$normalized%")
}

fun <T> eqIfNotNull(field: Field<T>, value: T?): Condition? = value?.let(field::eq)

fun <T : Comparable<T>> geIfNotNull(field: Field<T>, value: T?): Condition? = value?.let(field::ge)

fun <T : Comparable<T>> leIfNotNull(field: Field<T>, value: T?): Condition? = value?.let(field::le)

fun <T : Comparable<T>> ltIfNotNull(field: Field<T>, value: T?): Condition? = value?.let(field::lt)
