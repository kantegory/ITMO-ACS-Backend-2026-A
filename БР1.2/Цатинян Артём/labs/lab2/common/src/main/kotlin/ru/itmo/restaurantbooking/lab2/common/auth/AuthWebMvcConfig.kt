package ru.itmo.restaurantbooking.lab2.common.auth

import org.springframework.boot.autoconfigure.condition.ConditionalOnBean
import org.springframework.boot.context.properties.EnableConfigurationProperties
import org.springframework.context.annotation.Configuration
import org.springframework.web.method.support.HandlerMethodArgumentResolver
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer

@Configuration
@ConditionalOnBean(IdentityAuthClient::class)
@EnableConfigurationProperties(IdentityAuthClientProperties::class)
class AuthWebMvcConfig(
    private val identityAuthClient: IdentityAuthClient
) : WebMvcConfigurer {
    override fun addArgumentResolvers(resolvers: MutableList<HandlerMethodArgumentResolver>) {
        resolvers += AuthenticatedUserArgumentResolver(identityAuthClient)
    }
}
