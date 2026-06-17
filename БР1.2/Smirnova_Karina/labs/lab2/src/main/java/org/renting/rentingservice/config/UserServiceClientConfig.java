package org.renting.rentingservice.config;

import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
import org.springframework.web.client.RestClient;

@Configuration
@RequiredArgsConstructor
@Profile("!user & !notification")
public class UserServiceClientConfig {

    private final AppProperties appProperties;

    @Bean
    public RestClient userServiceRestClient() {
        return RestClient.builder()
                .baseUrl(appProperties.getServices().getUserServiceBaseUrl())
                .build();
    }

    @Bean
    public RestClient propertyServiceRestClient() {
        return RestClient.builder()
                .baseUrl(appProperties.getServices().getPropertyServiceBaseUrl())
                .build();
    }

    @Bean
    public RestClient communicationServiceRestClient() {
        return RestClient.builder()
                .baseUrl(appProperties.getServices().getCommunicationServiceBaseUrl())
                .build();
    }
}
