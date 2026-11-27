package ru.itmo.restaurantbooking.lab2.common.auth

import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty
import org.springframework.boot.context.properties.EnableConfigurationProperties
import org.springframework.stereotype.Component
import org.springframework.web.client.RestClient
import org.springframework.web.client.RestClientResponseException
import ru.itmo.restaurantbooking.lab2.common.exception.UnauthorizedException

@Component
@ConditionalOnProperty(prefix = "services", name = ["identity-base-url"])
@EnableConfigurationProperties(IdentityAuthClientProperties::class)
class IdentityAuthClient(
    properties: IdentityAuthClientProperties
) {
    private val restClient = RestClient.builder()
        .baseUrl(properties.identityBaseUrl)
        .build()

    fun validate(token: String): AuthenticatedUser =
        try {
            restClient.post()
                .uri("/internal/v1/auth/validate")
                .body(TokenValidationRequest(token))
                .retrieve()
                .body(AuthenticatedUser::class.java)
                ?: throw UnauthorizedException("Invalid access token")
        } catch (exception: RestClientResponseException) {
            throw UnauthorizedException("Invalid access token")
        }
}

private data class TokenValidationRequest(
    val accessToken: String
)
