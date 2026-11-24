package ru.itmo.pxdkxvan.lab23.gateway.config

import org.springframework.boot.context.properties.ConfigurationProperties

@ConfigurationProperties("app")
data class GatewayProperties(
    var security: SecurityProperties = SecurityProperties(),
)
