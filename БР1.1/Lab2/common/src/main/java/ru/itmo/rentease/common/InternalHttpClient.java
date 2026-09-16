package ru.itmo.rentease.common;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

@Component
public class InternalHttpClient {
    private final JwtService jwtService;
    private final String serviceName;

    public InternalHttpClient(JwtService jwtService,
                              @Value("${spring.application.name:unknown-service}") String serviceName) {
        this.jwtService = jwtService;
        this.serviceName = serviceName;
    }

    public <T> T get(String baseUrl, String path, Class<T> responseType) {
        try {
            return RestClient.builder().baseUrl(baseUrl).build().get().uri(path)
                    .header("Authorization", "Bearer " + jwtService.serviceToken(serviceName))
                    .header("X-Request-Id", java.util.UUID.randomUUID().toString())
                    .retrieve().body(responseType);
        } catch (RestClientException ex) {
            throw AppException.unavailable("Internal dependency is unavailable");
        }
    }

    public <T> T post(String baseUrl, String path, Object body, Class<T> responseType) {
        try {
            return RestClient.builder().baseUrl(baseUrl).build().post().uri(path)
                    .header("Authorization", "Bearer " + jwtService.serviceToken(serviceName))
                    .header("X-Request-Id", java.util.UUID.randomUUID().toString())
                    .header("Idempotency-Key", java.util.UUID.randomUUID().toString())
                    .body(body).retrieve().body(responseType);
        } catch (RestClientException ex) {
            throw AppException.unavailable("Internal dependency is unavailable");
        }
    }
}
