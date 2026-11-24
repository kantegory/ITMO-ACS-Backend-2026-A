package ru.itmo.pxdkxvan.lab23.user

import org.springframework.boot.autoconfigure.SpringBootApplication
import org.springframework.boot.context.properties.EnableConfigurationProperties
import org.springframework.boot.runApplication
import ru.itmo.pxdkxvan.lab23.user.config.UserProperties

@SpringBootApplication
@EnableConfigurationProperties(UserProperties::class)
class UserApplication

fun main(args: Array<String>) {
    runApplication<UserApplication>(*args)
}
