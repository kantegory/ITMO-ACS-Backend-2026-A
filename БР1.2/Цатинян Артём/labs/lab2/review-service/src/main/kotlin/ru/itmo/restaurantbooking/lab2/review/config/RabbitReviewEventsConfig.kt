package ru.itmo.restaurantbooking.lab2.review.config

import com.fasterxml.jackson.databind.ObjectMapper
import org.springframework.amqp.core.Binding
import org.springframework.amqp.core.BindingBuilder
import org.springframework.amqp.core.DirectExchange
import org.springframework.amqp.core.Queue
import org.springframework.amqp.rabbit.connection.ConnectionFactory
import org.springframework.amqp.rabbit.core.RabbitTemplate
import org.springframework.amqp.support.converter.DefaultJackson2JavaTypeMapper
import org.springframework.amqp.support.converter.Jackson2JsonMessageConverter
import org.springframework.amqp.support.converter.MessageConverter
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import ru.itmo.restaurantbooking.lab2.common.messaging.ReviewEvents

@Configuration
class RabbitReviewEventsConfig {
    @Bean
    fun reviewEventsExchange(): DirectExchange =
        DirectExchange(ReviewEvents.EXCHANGE, true, false)

    @Bean
    fun reviewCreatedQueue(): Queue =
        Queue(ReviewEvents.CREATED_QUEUE, true)

    @Bean
    fun reviewCreatedBinding(reviewCreatedQueue: Queue, reviewEventsExchange: DirectExchange): Binding =
        BindingBuilder.bind(reviewCreatedQueue)
            .to(reviewEventsExchange)
            .with(ReviewEvents.CREATED_ROUTING_KEY)

    @Bean
    fun rabbitMessageConverter(objectMapper: ObjectMapper): MessageConverter =
        Jackson2JsonMessageConverter(objectMapper).apply {
            setJavaTypeMapper(DefaultJackson2JavaTypeMapper().apply {
                setTrustedPackages("ru.itmo.restaurantbooking.lab2.common.messaging")
            })
        }

    @Bean
    fun rabbitTemplate(connectionFactory: ConnectionFactory, rabbitMessageConverter: MessageConverter): RabbitTemplate =
        RabbitTemplate(connectionFactory).apply {
            messageConverter = rabbitMessageConverter
        }
}
