package ru.itmo.pxdkxvan.lab23.notification.dto

data class PageResponse<T>(
    val items: List<T>,
    val meta: Meta,
)
