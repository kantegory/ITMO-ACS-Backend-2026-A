package org.renting.rentingservice.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;

import java.time.Duration;

@Getter
@Setter
@ConfigurationProperties(prefix = "app")
public class AppProperties {

    private final Jwt jwt = new Jwt();
    private final Services services = new Services();
    private final Payment payment = new Payment();

    @Getter
    @Setter
    public static class Services {
        /**
         * Base URL for the user-service inside the environment (Docker, k8s, local, etc).
         * Should include the context path, e.g. http://user-service:8080/api/v1
         */
        private String userServiceBaseUrl = "http://localhost:8080/api/v1";
        /**
         * Base URL for the property-service inside the environment.
         */
        private String propertyServiceBaseUrl = "http://localhost:8080/api/v1";
        /**
         * Base URL for the communication-service inside the environment.
         */
        private String communicationServiceBaseUrl = "http://localhost:8080/api/v1";
    }

    @Getter
    @Setter
    public static class Jwt {
        private String secret;
        private Duration accessTtl = Duration.ofMinutes(15);
        private Duration refreshTtl = Duration.ofDays(7);
    }

    @Getter
    @Setter
    public static class Payment {
        private int commissionPercent = 5;
        private double mockSuccessRate = 0.9;
    }
}
