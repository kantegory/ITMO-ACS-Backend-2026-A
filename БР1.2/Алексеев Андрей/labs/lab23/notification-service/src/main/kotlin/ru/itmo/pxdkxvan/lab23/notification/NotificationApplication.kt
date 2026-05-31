package ru.itmo.pxdkxvan.lab23.notification

import org.springframework.boot.autoconfigure.SpringBootApplication
import org.springframework.boot.context.properties.EnableConfigurationProperties
import org.springframework.boot.runApplication
import org.springframework.kafka.annotation.EnableKafka
import ru.itmo.pxdkxvan.lab23.notification.config.NotificationProperties

@SpringBootApplication
@EnableKafka
@EnableConfigurationProperties(NotificationProperties::class)
class NotificationApplication

fun main(args: Array<String>) {
    runApplication<NotificationApplication>(*args)
}
