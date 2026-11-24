package ru.itmo.pxdkxvan.lab23.company

import org.springframework.boot.autoconfigure.SpringBootApplication
import org.springframework.boot.context.properties.EnableConfigurationProperties
import org.springframework.boot.runApplication
import ru.itmo.pxdkxvan.lab23.company.config.CompanyProperties

@SpringBootApplication
@EnableConfigurationProperties(CompanyProperties::class)
class CompanyApplication

fun main(args: Array<String>) {
    runApplication<CompanyApplication>(*args)
}
