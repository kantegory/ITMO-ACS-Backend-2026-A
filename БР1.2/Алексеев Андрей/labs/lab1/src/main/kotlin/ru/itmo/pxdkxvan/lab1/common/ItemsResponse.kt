package ru.itmo.pxdkxvan.lab1.common

import org.springframework.data.domain.Page

data class ItemsResponse<T>(
    val items: List<T>,
)
