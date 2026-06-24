package ru.itmo.restaurantbooking.lab2.booking.config

import org.springframework.boot.context.properties.ConfigurationProperties

@ConfigurationProperties(prefix = "services")
data class ServiceUrls(
    val catalogBaseUrl: String
)
