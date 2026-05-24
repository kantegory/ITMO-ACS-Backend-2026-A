package org.renting.rentingservice;

import org.junit.jupiter.api.Test;
import org.testcontainers.junit.jupiter.EnabledIfDockerAvailable;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.ActiveProfiles;

@Import(TestcontainersConfiguration.class)
@SpringBootTest
@ActiveProfiles("test")
@EnabledIfDockerAvailable
class RentingServiceApplicationTests {

    @Test
    void contextLoads() {
    }

}
