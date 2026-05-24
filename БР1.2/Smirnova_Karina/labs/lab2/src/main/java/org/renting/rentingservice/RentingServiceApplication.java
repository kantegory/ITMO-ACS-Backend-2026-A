package org.renting.rentingservice;

import org.renting.rentingservice.config.AppProperties;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.EnableConfigurationProperties;

@SpringBootApplication
@EnableConfigurationProperties(AppProperties.class)
public class RentingServiceApplication {

    public static void main(String[] args) {
        SpringApplication.run(RentingServiceApplication.class, args);
    }

}

// {
//    "email": "test@mail.ru",
//    "password": "password123"
//}

// {
//    "email": "user@example.com",
//    "password": "password123"
//}

// Check action