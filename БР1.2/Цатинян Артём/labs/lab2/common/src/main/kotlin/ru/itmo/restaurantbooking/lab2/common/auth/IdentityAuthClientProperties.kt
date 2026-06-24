package ru.itmo.restaurantbooking.lab2.common.auth

import org.springframework.boot.context.properties.ConfigurationProperties

@ConfigurationProperties(prefix = "services")
data class IdentityAuthClientProperties(
    val identityBaseUrl: String = ""
)
