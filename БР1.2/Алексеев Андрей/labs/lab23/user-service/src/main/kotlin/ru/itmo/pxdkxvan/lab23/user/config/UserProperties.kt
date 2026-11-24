package ru.itmo.pxdkxvan.lab23.user.config

import org.springframework.boot.context.properties.ConfigurationProperties

@ConfigurationProperties("app")
data class UserProperties(
    var security: SecurityProperties = SecurityProperties(),
)
