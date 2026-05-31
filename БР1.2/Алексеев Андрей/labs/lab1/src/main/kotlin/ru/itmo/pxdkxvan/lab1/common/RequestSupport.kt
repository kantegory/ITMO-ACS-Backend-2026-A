package ru.itmo.pxdkxvan.lab1.common

import jakarta.servlet.http.HttpServletRequest
import org.springframework.data.domain.PageRequest
import org.springframework.data.domain.Pageable
import org.springframework.data.domain.Sort
import org.springframework.http.HttpStatus
import java.math.BigDecimal
import java.net.URLDecoder
import java.nio.charset.StandardCharsets

fun requireCondition(condition: Boolean, message: String, field: String? = null) {
    if (!condition) {
        throw ApiException(
            status = HttpStatus.BAD_REQUEST,
            error = ApiErrorCode.VALIDATION,
            message = message,
            details = field?.let { listOf(ErrorDetail(it, message)) } ?: emptyList(),
        )
    }
}

fun normalizeCode(raw: String): String =
    raw.trim().lowercase()
        .replace(Regex("[^a-z0-9]+"), "-")
        .trim('-')

fun requireNonNegative(value: BigDecimal?, field: String) {
    if (value != null) {
        requireCondition(value.signum() >= 0, "$field must be non-negative", field)
    }
}

fun validateSalaryRange(salaryFrom: BigDecimal?, salaryTo: BigDecimal?, fromField: String = "salary_from", toField: String = "salary_to") {
    requireNonNegative(salaryFrom, fromField)
    requireNonNegative(salaryTo, toField)
    if (salaryFrom != null && salaryTo != null) {
        requireCondition(salaryFrom <= salaryTo, "$fromField must be less than or equal to $toField", fromField)
    }
}

fun extractBracketParameters(request: HttpServletRequest, prefix: String): LinkedHashMap<String, List<String>> {
    val values = LinkedHashMap<String, MutableList<String>>()
    request.queryString.orEmpty()
        .split("&")
        .filter { it.isNotBlank() }
        .forEach { pair ->
            val separatorIndex = pair.indexOf('=')
            val encodedKey = if (separatorIndex >= 0) pair.substring(0, separatorIndex) else pair
            val encodedValue = if (separatorIndex >= 0) pair.substring(separatorIndex + 1) else ""
            val key = URLDecoder.decode(encodedKey, StandardCharsets.UTF_8)
            val value = URLDecoder.decode(encodedValue, StandardCharsets.UTF_8).trim()
            val match = Regex("^${Regex.escape(prefix)}\\[([^]]+)]$").matchEntire(key) ?: return@forEach
            if (value.isNotBlank()) {
                values.computeIfAbsent(match.groupValues[1]) { mutableListOf() }.add(value)
            }
        }

    return LinkedHashMap(values.mapValues { (_, value) -> value.toList() })
}

fun buildPageable(
    page: Int,
    limit: Int,
    sortRules: Map<String, String>,
    supportedSorts: Map<String, String>,
    defaultSorts: List<Pair<String, Sort.Direction>>,
): Pageable {
    requireCondition(page > 0, "page must be greater than 0", "page")
    requireCondition(limit in 1..100, "limit must be between 1 and 100", "limit")

    val orders = if (sortRules.isEmpty()) {
        defaultSorts.map { Sort.Order(it.second, it.first) }
    } else {
        sortRules.entries.map { (field, rawDirection) ->
            val property = supportedSorts[field]
                ?: throw ApiException(
                    status = HttpStatus.BAD_REQUEST,
                    error = ApiErrorCode.VALIDATION,
                    message = "Unsupported sort field",
                    details = listOf(ErrorDetail("sort[$field]", "Supported fields: ${supportedSorts.keys.joinToString()}")),
                )

            val direction = SortDirection.parse(rawDirection, "sort[$field]").toSpringDirection()

            Sort.Order(direction, property)
        }
    }

    return PageRequest.of(page - 1, limit, Sort.by(orders))
}
