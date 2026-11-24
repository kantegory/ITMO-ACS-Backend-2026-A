package ru.itmo.pxdkxvan.lab23.search.config

import org.springframework.boot.context.properties.ConfigurationProperties

@ConfigurationProperties("app")
data class SearchProperties(
    var security: SecurityProperties = SecurityProperties(),
)
