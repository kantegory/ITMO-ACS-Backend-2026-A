package ru.itmo.rentease.property;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication(scanBasePackages = {"ru.itmo.rentease.common", "ru.itmo.rentease.property"})
public class PropertyApplication {
    public static void main(String[] args) { SpringApplication.run(PropertyApplication.class, args); }
}
