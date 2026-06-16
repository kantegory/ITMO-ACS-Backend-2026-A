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
    private final Payment payment = new Payment();

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
