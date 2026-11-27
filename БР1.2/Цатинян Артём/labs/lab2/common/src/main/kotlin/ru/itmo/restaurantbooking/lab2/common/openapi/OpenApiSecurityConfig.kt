package ru.itmo.restaurantbooking.lab2.common.openapi

import io.swagger.v3.oas.models.Components
import io.swagger.v3.oas.models.OpenAPI
import io.swagger.v3.oas.models.security.OAuthFlow
import io.swagger.v3.oas.models.security.OAuthFlows
import io.swagger.v3.oas.models.security.Scopes
import io.swagger.v3.oas.models.security.SecurityRequirement
import io.swagger.v3.oas.models.security.SecurityScheme
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration

@Configuration
class OpenApiSecurityConfig {
    @Bean
    fun openApi(): OpenAPI =
        OpenAPI()
            .components(
                Components().addSecuritySchemes(
                    "oauth2Password",
                    SecurityScheme()
                        .type(SecurityScheme.Type.OAUTH2)
                        .flows(
                            OAuthFlows().password(
                                OAuthFlow()
                                    .tokenUrl("http://localhost:8081/api/v1/auth/token")
                                    .scopes(Scopes().addString("default", "Default access"))
                            )
                        )
                )
            )
            .addSecurityItem(SecurityRequirement().addList("oauth2Password", listOf("default")))
}
