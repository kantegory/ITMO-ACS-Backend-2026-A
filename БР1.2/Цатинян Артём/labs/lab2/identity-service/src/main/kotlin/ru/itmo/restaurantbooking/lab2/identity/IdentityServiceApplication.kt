package ru.itmo.restaurantbooking.lab2.identity

import org.springframework.boot.autoconfigure.SpringBootApplication
import org.springframework.boot.context.properties.EnableConfigurationProperties
import org.springframework.boot.runApplication
import ru.itmo.restaurantbooking.lab2.identity.config.JwtProperties

@SpringBootApplication(scanBasePackages = ["ru.itmo.restaurantbooking.lab2"])
@EnableConfigurationProperties(JwtProperties::class)
class IdentityServiceApplication

fun main(args: Array<String>) {
    runApplication<IdentityServiceApplication>(*args)
}
