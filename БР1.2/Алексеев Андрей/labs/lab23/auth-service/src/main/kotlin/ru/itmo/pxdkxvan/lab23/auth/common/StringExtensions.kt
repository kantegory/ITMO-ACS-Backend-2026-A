package ru.itmo.pxdkxvan.lab23.auth.common

fun String.normalizedEmail(): String = trim().lowercase()
