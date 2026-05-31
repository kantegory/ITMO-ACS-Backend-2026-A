package ru.itmo.restaurantbooking.lab2.review

import org.springframework.boot.autoconfigure.SpringBootApplication
import org.springframework.boot.context.properties.EnableConfigurationProperties
import org.springframework.boot.runApplication
import org.springframework.scheduling.annotation.EnableScheduling
import ru.itmo.restaurantbooking.lab2.review.config.ServiceUrls

@SpringBootApplication(scanBasePackages = ["ru.itmo.restaurantbooking.lab2"])
@EnableConfigurationProperties(ServiceUrls::class)
@EnableScheduling
class ReviewServiceApplication

fun main(args: Array<String>) {
    runApplication<ReviewServiceApplication>(*args)
}
