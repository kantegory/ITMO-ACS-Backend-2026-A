package ru.itmo.restaurantbooking.lab2.identity.config

import org.springframework.boot.context.properties.ConfigurationProperties

@ConfigurationProperties(prefix = "security.jwt")
data class JwtProperties(
    val secret: String,
    val ttlSeconds: Long = 3600
)
