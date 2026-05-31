package ru.itmo.pxdkxvan.lab23.company.config

import org.springframework.boot.context.properties.ConfigurationProperties

@ConfigurationProperties("app")
data class CompanyProperties(
    var security: SecurityProperties = SecurityProperties(),
)
