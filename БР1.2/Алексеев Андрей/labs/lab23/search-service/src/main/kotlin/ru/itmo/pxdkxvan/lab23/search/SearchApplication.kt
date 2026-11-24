package ru.itmo.pxdkxvan.lab23.search

import org.springframework.boot.autoconfigure.SpringBootApplication
import org.springframework.boot.context.properties.EnableConfigurationProperties
import org.springframework.boot.runApplication
import org.springframework.kafka.annotation.EnableKafka
import ru.itmo.pxdkxvan.lab23.search.config.SearchProperties

@SpringBootApplication
@EnableKafka
@EnableConfigurationProperties(SearchProperties::class)
class SearchApplication

fun main(args: Array<String>) {
    runApplication<SearchApplication>(*args)
}
