package ru.itmo.pxdkxvan.lab23.application.config

data class ClientProperties(
    var resumeUrl: String = "http://localhost:8086",
    var vacancyUrl: String = "http://localhost:8084",
)
