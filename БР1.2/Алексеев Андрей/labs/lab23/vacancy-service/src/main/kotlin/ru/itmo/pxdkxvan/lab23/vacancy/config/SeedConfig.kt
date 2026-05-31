package ru.itmo.pxdkxvan.lab23.vacancy.config

import org.springframework.boot.CommandLineRunner
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import ru.itmo.pxdkxvan.lab23.vacancy.entity.ExperienceLevelEntity
import ru.itmo.pxdkxvan.lab23.vacancy.entity.IndustryEntity
import ru.itmo.pxdkxvan.lab23.vacancy.repository.ExperienceLevelRepository
import ru.itmo.pxdkxvan.lab23.vacancy.repository.IndustryRepository

@Configuration
class SeedConfig {
    @Bean
    fun seedDictionaries(
        industryRepository: IndustryRepository,
        experienceLevelRepository: ExperienceLevelRepository,
    ) = CommandLineRunner {
        if (industryRepository.count() == 0L) {
            industryRepository.saveAll(
                listOf(
                    IndustryEntity(code = "software-development", displayName = "Software Development"),
                    IndustryEntity(code = "fintech", displayName = "FinTech"),
                ),
            )
        }
        if (experienceLevelRepository.count() == 0L) {
            experienceLevelRepository.saveAll(
                listOf(
                    ExperienceLevelEntity(code = "junior", displayName = "Junior"),
                    ExperienceLevelEntity(code = "middle", displayName = "Middle"),
                    ExperienceLevelEntity(code = "senior", displayName = "Senior"),
                ),
            )
        }
    }
}
