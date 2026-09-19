package ru.itmo.rentease.communication;

import org.springframework.amqp.core.Binding;
import org.springframework.amqp.core.BindingBuilder;
import org.springframework.amqp.core.DirectExchange;
import org.springframework.amqp.core.Queue;
import org.springframework.amqp.support.converter.Jackson2JsonMessageConverter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import static ru.itmo.rentease.common.MessagingConstants.*;

@Configuration
public class RabbitMqConfig {
    @Bean
    DirectExchange renteaseExchange() {
        return new DirectExchange(EXCHANGE, true, false);
    }

    @Bean
    Queue bookingConfirmedQueue() {
        return new Queue(BOOKING_CONFIRMED_QUEUE, true);
    }

    @Bean
    Binding bookingConfirmedBinding(Queue bookingConfirmedQueue, DirectExchange renteaseExchange) {
        return BindingBuilder.bind(bookingConfirmedQueue).to(renteaseExchange).with(BOOKING_CONFIRMED_KEY);
    }

    @Bean
    Jackson2JsonMessageConverter messageConverter() {
        return new Jackson2JsonMessageConverter();
    }
}
