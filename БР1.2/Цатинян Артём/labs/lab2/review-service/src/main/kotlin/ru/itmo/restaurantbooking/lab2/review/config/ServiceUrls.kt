package ru.itmo.restaurantbooking.lab2.review.config

import org.springframework.boot.context.properties.ConfigurationProperties

@ConfigurationProperties(prefix = "services")
data class ServiceUrls(
    val bookingBaseUrl: String
)
