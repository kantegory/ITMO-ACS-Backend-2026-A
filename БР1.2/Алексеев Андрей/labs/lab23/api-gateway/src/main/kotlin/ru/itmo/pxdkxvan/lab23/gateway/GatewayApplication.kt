package ru.itmo.pxdkxvan.lab23.gateway

import org.springframework.boot.autoconfigure.SpringBootApplication
import org.springframework.boot.context.properties.EnableConfigurationProperties
import org.springframework.boot.runApplication
import ru.itmo.pxdkxvan.lab23.gateway.config.GatewayProperties

@SpringBootApplication
@EnableConfigurationProperties(GatewayProperties::class)
class GatewayApplication

fun main(args: Array<String>) {
    runApplication<GatewayApplication>(*args)
}
