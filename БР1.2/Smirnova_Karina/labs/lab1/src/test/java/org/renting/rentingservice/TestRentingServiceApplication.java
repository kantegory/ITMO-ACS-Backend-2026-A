package org.renting.rentingservice;

import org.springframework.boot.SpringApplication;

public class TestRentingServiceApplication {

    public static void main(String[] args) {
        SpringApplication.from(RentingServiceApplication::main).with(TestcontainersConfiguration.class).run(args);
    }

}
