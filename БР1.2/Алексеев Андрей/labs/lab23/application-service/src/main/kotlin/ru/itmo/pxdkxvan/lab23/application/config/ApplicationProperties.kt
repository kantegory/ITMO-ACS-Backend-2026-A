package ru.itmo.pxdkxvan.lab23.application.config

import org.springframework.boot.context.properties.ConfigurationProperties

@ConfigurationProperties("app")
data class ApplicationProperties(
    var security: SecurityProperties = SecurityProperties(),
    var clients: ClientProperties = ClientProperties(),
)
