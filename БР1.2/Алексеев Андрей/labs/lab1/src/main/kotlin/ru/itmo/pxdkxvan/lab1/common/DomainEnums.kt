package ru.itmo.pxdkxvan.lab1.common

import org.springframework.data.domain.Sort
import org.springframework.http.HttpStatus

enum class SystemRole {
    ADMIN,
    APPLICANT,
    EMPLOYER,
    DICTIONARY_EDITOR,
}

enum class EmploymentType {
    FULL_TIME,
    PART_TIME,
    CONTRACT,
    INTERNSHIP,
}

enum class WorkFormat {
    OFFICE,
    REMOTE,
    HYBRID,
}

enum class PublicationStatus {
    DRAFT,
    PUBLISHED,
    ARCHIVED,
}

enum class ApplicationStatus {
    PENDING,
    VIEWED,
    INVITED,
    REJECTED,
    ACCEPTED,
}

enum class AssignmentRole {
    PRIMARY,
    RECRUITER,
    COORDINATOR,
}

enum class SortDirection {
    ASC,
    DESC;

    fun toSpringDirection(): Sort.Direction = Sort.Direction.fromString(name)

    companion object {
        fun parse(raw: String, field: String): SortDirection =
            entries.firstOrNull { it.name.equals(raw, ignoreCase = true) }
                ?: throw ApiException(
                    status = HttpStatus.BAD_REQUEST,
                    error = ApiErrorCode.VALIDATION,
                    message = "Unsupported sort direction",
                    details = listOf(ErrorDetail(field, "Supported values: asc, desc")),
                )
    }
}

inline fun <reified T : Enum<T>> parseEnumValue(field: String, value: String): T =
    enumValues<T>().firstOrNull { it.name.equals(value.trim(), ignoreCase = true) }
        ?: throw ApiException(
            status = HttpStatus.BAD_REQUEST,
            error = ApiErrorCode.VALIDATION,
            message = "Invalid value for $field",
            details = listOf(ErrorDetail(field, "Allowed values: ${enumValues<T>().joinToString { it.name }}")),
        )
