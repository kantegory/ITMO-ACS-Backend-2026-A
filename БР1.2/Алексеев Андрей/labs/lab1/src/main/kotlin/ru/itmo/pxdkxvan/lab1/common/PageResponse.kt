package ru.itmo.pxdkxvan.lab1.common

import org.springframework.data.domain.Page

data class PageResponse<T>(
    val items: List<T>,
    val meta: PaginationMeta,
)
