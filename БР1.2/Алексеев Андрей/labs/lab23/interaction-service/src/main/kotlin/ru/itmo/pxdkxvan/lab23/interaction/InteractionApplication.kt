package ru.itmo.pxdkxvan.lab23.interaction

import org.springframework.boot.autoconfigure.SpringBootApplication
import org.springframework.boot.context.properties.EnableConfigurationProperties
import org.springframework.boot.runApplication
import org.springframework.cloud.openfeign.EnableFeignClients
import ru.itmo.pxdkxvan.lab23.interaction.config.InteractionProperties

@SpringBootApplication
@EnableFeignClients
@EnableConfigurationProperties(InteractionProperties::class)
class InteractionApplication

fun main(args: Array<String>) {
    runApplication<InteractionApplication>(*args)
}
