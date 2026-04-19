package ru.itmo.restaurantbooking

import org.springframework.boot.context.properties.ConfigurationPropertiesScan
import org.springframework.boot.autoconfigure.SpringBootApplication
import org.springframework.boot.runApplication

@SpringBootApplication
@ConfigurationPropertiesScan
class RestaurantBookingApplication

fun main(args: Array<String>) {
    runApplication<RestaurantBookingApplication>(*args)
}
