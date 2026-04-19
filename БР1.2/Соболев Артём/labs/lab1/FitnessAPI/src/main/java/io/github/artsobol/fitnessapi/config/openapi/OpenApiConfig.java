package io.github.artsobol.fitnessapi.config.openapi;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.info.BuildProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.annotation.AnnotatedElementUtils;
import org.springframework.http.HttpHeaders;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.method.HandlerMethod;

import java.util.List;

import org.springdoc.core.customizers.OperationCustomizer;

@Configuration
@RequiredArgsConstructor
public class OpenApiConfig {

    public static final String JWT_SECURITY_SCHEME = "bearerAuth";

    private final BuildProperties buildProperties;

    @Bean
    public OpenAPI fitnessOpenAPI() {
        return new OpenAPI()
                .info(new Info().title("Fitness API").version(buildProperties.getVersion()))
                .components(new Components().addSecuritySchemes(
                        JWT_SECURITY_SCHEME,
                        new SecurityScheme()
                                .type(SecurityScheme.Type.HTTP)
                                .scheme("bearer")
                                .bearerFormat("JWT")
                                .in(SecurityScheme.In.HEADER)
                                .name(HttpHeaders.AUTHORIZATION)
                                .description("Paste JWT access token. Swagger UI sends it as Authorization: Bearer <token>.")
                ));
    }

    @Bean
    public OperationCustomizer jwtSecurityOperationCustomizer() {
        return (operation, handlerMethod) -> {
            boolean isPublicEndpoint = isPublicEndpoint(handlerMethod);

            if (isPublicEndpoint) {
                operation.setSecurity(List.of());
                return operation;
            }

            if (operation.getSecurity() == null || operation.getSecurity().isEmpty()) {
                operation.addSecurityItem(new SecurityRequirement().addList(JWT_SECURITY_SCHEME));
            }

            return operation;
        };
    }

    private boolean isPublicEndpoint(HandlerMethod handlerMethod) {
        if (AnnotatedElementUtils.hasAnnotation(handlerMethod.getMethod(), PublicEndpoint.class)
                || AnnotatedElementUtils.hasAnnotation(handlerMethod.getBeanType(), PublicEndpoint.class)) {
            return true;
        }

        if (AnnotatedElementUtils.hasAnnotation(handlerMethod.getMethod(), ProtectedEndpoint.class)
                || AnnotatedElementUtils.hasAnnotation(handlerMethod.getBeanType(), ProtectedEndpoint.class)) {
            return false;
        }

        return isGetEndpoint(handlerMethod);
    }

    private boolean isGetEndpoint(HandlerMethod handlerMethod) {
        RequestMapping requestMapping = AnnotatedElementUtils.findMergedAnnotation(
                handlerMethod.getMethod(),
                RequestMapping.class
        );

        return requestMapping != null
                && requestMapping.method().length == 1
                && requestMapping.method()[0] == RequestMethod.GET;
    }
}
