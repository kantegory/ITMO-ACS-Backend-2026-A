package ru.itmo.pxdkxvan.lab23.auth.config

import org.springframework.boot.context.properties.ConfigurationProperties

@ConfigurationProperties("app")
data class AuthProperties(
    var security: SecurityProperties = SecurityProperties(),
    var clients: ClientProperties = ClientProperties(),
)
