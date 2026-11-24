package ru.itmo.pxdkxvan.lab23.resume.config

import org.springframework.boot.context.properties.ConfigurationProperties

@ConfigurationProperties("app")
data class ResumeProperties(
    var security: SecurityProperties = SecurityProperties(),
)
