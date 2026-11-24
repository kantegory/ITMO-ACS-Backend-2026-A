package ru.itmo.pxdkxvan.lab1.common

import org.springframework.data.domain.Page

fun <T, R> Page<T>.toPageResponse(page: Int, limit: Int, mapper: (T) -> R): PageResponse<R> =
    PageResponse(
        items = content.map(mapper),
        meta = PaginationMeta(page = page, limit = limit, total = totalElements),
    )
