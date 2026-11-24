package ru.itmo.pxdkxvan.lab23.resume.dto

data class PageResponse<T>(
    val items: List<T>,
    val meta: Meta,
)
