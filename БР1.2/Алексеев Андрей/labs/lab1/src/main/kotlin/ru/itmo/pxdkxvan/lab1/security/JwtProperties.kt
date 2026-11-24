package ru.itmo.pxdkxvan.lab1.security

import org.springframework.boot.context.properties.ConfigurationProperties

@ConfigurationProperties(prefix = "app.security.jwt")
data class JwtProperties(
    val secret: String,
    val accessTtlMinutes: Long,
)
