package ru.itmo.pxdkxvan.lab23.interaction.config

import org.springframework.boot.context.properties.ConfigurationProperties

@ConfigurationProperties("app")
data class InteractionProperties(
    var security: SecurityProperties = SecurityProperties(),
    var clients: ClientProperties = ClientProperties(),
)
