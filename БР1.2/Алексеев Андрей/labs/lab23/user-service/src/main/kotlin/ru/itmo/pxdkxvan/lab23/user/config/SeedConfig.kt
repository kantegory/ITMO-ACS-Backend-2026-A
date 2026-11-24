package ru.itmo.pxdkxvan.lab23.user.config

import org.springframework.boot.CommandLineRunner
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import ru.itmo.pxdkxvan.lab23.user.common.SystemRole
import ru.itmo.pxdkxvan.lab23.user.entity.RoleEntity
import ru.itmo.pxdkxvan.lab23.user.repository.RoleRepository

@Configuration
class SeedConfig {
    @Bean
    fun seedRoles(roleRepository: RoleRepository) = CommandLineRunner {
        SystemRole.entries.forEach { role ->
            if (roleRepository.findByName(role.name) == null) {
                roleRepository.save(RoleEntity(name = role.name, description = role.name))
            }
        }
    }
}
