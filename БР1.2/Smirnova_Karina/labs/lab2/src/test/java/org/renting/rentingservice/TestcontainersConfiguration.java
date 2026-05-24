package org.renting.rentingservice;

import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.context.annotation.Bean;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.utility.DockerImageName;

@TestConfiguration(proxyBeanMethods = false)
public class TestcontainersConfiguration {

    @Bean
    @ServiceConnection
    PostgreSQLContainer<?> postgresContainer() {
        DockerImageName image = DockerImageName.parse("postgis/postgis:16-3.4")
                .asCompatibleSubstituteFor("postgres");
        return new PostgreSQLContainer<>(image)
                .withDatabaseName("renting_test")
                .withUsername("test")
                .withPassword("test");
    }
}
