package ru.itmo.pxdkxvan.lab23.auth.config

import org.springframework.cloud.openfeign.EnableFeignClients
import org.springframework.context.annotation.Configuration
import org.springframework.context.annotation.Profile
import ru.itmo.pxdkxvan.lab23.auth.client.UserClient

@Configuration
@Profile("!standalone-auth")
@EnableFeignClients(clients = [UserClient::class])
class UserClientConfig
