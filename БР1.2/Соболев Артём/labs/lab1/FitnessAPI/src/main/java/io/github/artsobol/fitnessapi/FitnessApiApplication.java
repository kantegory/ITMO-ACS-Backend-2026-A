package io.github.artsobol.fitnessapi;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.ConfigurationPropertiesScan;

@SpringBootApplication
@ConfigurationPropertiesScan
public class FitnessApiApplication {

    public static void main(String[] args) {
        SpringApplication.run(FitnessApiApplication.class, args);
    }

}
