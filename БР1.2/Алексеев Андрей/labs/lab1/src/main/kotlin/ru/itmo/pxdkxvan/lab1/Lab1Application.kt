package ru.itmo.pxdkxvan.lab1

import org.springframework.boot.autoconfigure.SpringBootApplication
import org.springframework.boot.context.properties.ConfigurationPropertiesScan
import org.springframework.boot.runApplication

@SpringBootApplication
@ConfigurationPropertiesScan
class Lab1Application

fun main(args: Array<String>) {
	runApplication<Lab1Application>(*args)
}
