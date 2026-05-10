package io.github.artsobol.progressservice.integration.training.client;

import org.slf4j.MDC;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.client.RestClient;

@Configuration
@EnableConfigurationProperties(TrainingServiceClientProperties.class)
public class TrainingServiceClientConfig {

    @Bean
    RestClient trainingServiceRestClient(
            RestClient.Builder restClientBuilder,
            TrainingServiceClientProperties properties
    ) {
        return restClientBuilder
                .baseUrl(properties.baseUrl())
                .requestInterceptor((request, body, execution) -> {
                    String requestId = MDC.get("requestId");
                    if (requestId != null && !requestId.isBlank()) {
                        request.getHeaders().set("X-Request-Id", requestId);
                    }
                    return execution.execute(request, body);
                })
                .build();
    }
}
