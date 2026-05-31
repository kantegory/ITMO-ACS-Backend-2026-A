package ru.itmo.pxdkxvan.lab23.notification.config

import org.springframework.boot.context.properties.ConfigurationProperties

@ConfigurationProperties("app")
data class NotificationProperties(
    var security: SecurityProperties = SecurityProperties(),
)
