package ru.itmo.pxdkxvan.lab23.resume

import org.springframework.boot.autoconfigure.SpringBootApplication
import org.springframework.boot.context.properties.EnableConfigurationProperties
import org.springframework.boot.runApplication
import ru.itmo.pxdkxvan.lab23.resume.config.ResumeProperties

@SpringBootApplication
@EnableConfigurationProperties(ResumeProperties::class)
class ResumeApplication

fun main(args: Array<String>) {
    runApplication<ResumeApplication>(*args)
}
