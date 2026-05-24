package ru.itmo.restaurantbooking.lab2.review

import org.springframework.boot.autoconfigure.SpringBootApplication
import org.springframework.boot.context.properties.EnableConfigurationProperties
import org.springframework.boot.runApplication
import ru.itmo.restaurantbooking.lab2.review.config.ServiceUrls

@SpringBootApplication(scanBasePackages = ["ru.itmo.restaurantbooking.lab2"])
@EnableConfigurationProperties(ServiceUrls::class)
class ReviewServiceApplication

fun main(args: Array<String>) {
    runApplication<ReviewServiceApplication>(*args)
}
