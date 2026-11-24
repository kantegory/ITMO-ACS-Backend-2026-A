package ru.itmo.pxdkxvan.lab23.application

import org.springframework.boot.autoconfigure.SpringBootApplication
import org.springframework.boot.context.properties.EnableConfigurationProperties
import org.springframework.boot.runApplication
import org.springframework.cloud.openfeign.EnableFeignClients
import ru.itmo.pxdkxvan.lab23.application.config.ApplicationProperties

@SpringBootApplication
@EnableFeignClients
@EnableConfigurationProperties(ApplicationProperties::class)
class ApplicationApplication

fun main(args: Array<String>) {
    runApplication<ApplicationApplication>(*args)
}
