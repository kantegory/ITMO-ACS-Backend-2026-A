package ru.itmo.pxdkxvan.lab23.auth

import org.springframework.boot.autoconfigure.SpringBootApplication
import org.springframework.boot.context.properties.EnableConfigurationProperties
import org.springframework.boot.runApplication
import org.springframework.cloud.openfeign.EnableFeignClients
import ru.itmo.pxdkxvan.lab23.auth.config.AuthProperties

@SpringBootApplication
@EnableFeignClients
@EnableConfigurationProperties(AuthProperties::class)
class AuthApplication

fun main(args: Array<String>) {
    runApplication<AuthApplication>(*args)
}
