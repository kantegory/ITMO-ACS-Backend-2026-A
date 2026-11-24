package ru.itmo.pxdkxvan.lab23.vacancy.config

import org.springframework.boot.context.properties.ConfigurationProperties

@ConfigurationProperties("app")
data class VacancyProperties(
    var security: SecurityProperties = SecurityProperties(),
    var clients: ClientProperties = ClientProperties(),
)
