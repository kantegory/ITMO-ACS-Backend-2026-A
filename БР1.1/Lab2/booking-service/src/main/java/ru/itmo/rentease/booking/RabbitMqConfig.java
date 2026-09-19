package ru.itmo.rentease.booking;

import org.springframework.amqp.core.DirectExchange;
import org.springframework.amqp.support.converter.Jackson2JsonMessageConverter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import static ru.itmo.rentease.common.MessagingConstants.EXCHANGE;

@Configuration
public class RabbitMqConfig {
    @Bean
    DirectExchange renteaseExchange() {
        return new DirectExchange(EXCHANGE, true, false);
    }

    @Bean
    Jackson2JsonMessageConverter messageConverter() {
        return new Jackson2JsonMessageConverter();
    }
}
