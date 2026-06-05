package io.github.artsobol.progressservice;

import org.springframework.amqp.rabbit.annotation.EnableRabbit;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@EnableRabbit
@SpringBootApplication
public class ProgressServiceApplication {

	public static void main(String[] args) {
		SpringApplication.run(ProgressServiceApplication.class, args);
	}

}
