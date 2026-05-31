package ru.itmo.pxdkxvan.lab23.vacancy

import org.springframework.boot.autoconfigure.SpringBootApplication
import org.springframework.boot.context.properties.EnableConfigurationProperties
import org.springframework.boot.runApplication
import org.springframework.cloud.openfeign.EnableFeignClients
import ru.itmo.pxdkxvan.lab23.vacancy.config.VacancyProperties

@SpringBootApplication
@EnableFeignClients
@EnableConfigurationProperties(VacancyProperties::class)
class VacancyApplication

fun main(args: Array<String>) {
    runApplication<VacancyApplication>(*args)
}
