package ru.itmo.pxdkxvan.lab1.common

import org.springframework.data.domain.Page

data class PaginationMeta(
    val page: Int,
    val limit: Int,
    val total: Long,
)
