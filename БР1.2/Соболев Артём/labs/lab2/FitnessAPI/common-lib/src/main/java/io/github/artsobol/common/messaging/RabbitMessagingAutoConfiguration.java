package io.github.artsobol.common.messaging;

import org.springframework.amqp.core.Binding;
import org.springframework.amqp.core.BindingBuilder;
import org.springframework.amqp.core.DirectExchange;
import org.springframework.amqp.core.Queue;
import org.springframework.amqp.core.QueueBuilder;
import org.springframework.boot.autoconfigure.AutoConfiguration;
import org.springframework.boot.autoconfigure.condition.ConditionalOnClass;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.context.annotation.Bean;

@AutoConfiguration
@ConditionalOnClass(DirectExchange.class)
public class RabbitMessagingAutoConfiguration {

    @Bean
    public DirectExchange trainingEventsExchange() {
        return new DirectExchange(RabbitTopology.TRAINING_EVENTS_EXCHANGE, true, false);
    }

    @Bean
    public Queue progressTrainingEventsQueue() {
        return QueueBuilder.durable(RabbitTopology.PROGRESS_TRAINING_EVENTS_QUEUE).build();
    }

    @Bean
    public Binding progressTrainingEventsBinding(
            @Qualifier("progressTrainingEventsQueue") Queue progressTrainingEventsQueue,
            @Qualifier("trainingEventsExchange") DirectExchange trainingEventsExchange
    ) {
        return BindingBuilder
                .bind(progressTrainingEventsQueue)
                .to(trainingEventsExchange)
                .with(RabbitTopology.TRAINING_CHANGED_ROUTING_KEY);
    }

    @Bean
    public DirectExchange mediaEventsExchange() {
        return new DirectExchange(RabbitTopology.MEDIA_EVENTS_EXCHANGE, true, false);
    }

    @Bean
    public Queue trainingVideoEventsQueue() {
        return QueueBuilder.durable(RabbitTopology.TRAINING_VIDEO_EVENTS_QUEUE).build();
    }

    @Bean
    public Queue blogVideoEventsQueue() {
        return QueueBuilder.durable(RabbitTopology.BLOG_VIDEO_EVENTS_QUEUE).build();
    }

    @Bean
    public Binding trainingVideoEventsBinding(
            @Qualifier("trainingVideoEventsQueue") Queue trainingVideoEventsQueue,
            @Qualifier("mediaEventsExchange") DirectExchange mediaEventsExchange
    ) {
        return BindingBuilder
                .bind(trainingVideoEventsQueue)
                .to(mediaEventsExchange)
                .with(RabbitTopology.VIDEO_CHANGED_ROUTING_KEY);
    }

    @Bean
    public Binding blogVideoEventsBinding(
            @Qualifier("blogVideoEventsQueue") Queue blogVideoEventsQueue,
            @Qualifier("mediaEventsExchange") DirectExchange mediaEventsExchange
    ) {
        return BindingBuilder
                .bind(blogVideoEventsQueue)
                .to(mediaEventsExchange)
                .with(RabbitTopology.VIDEO_CHANGED_ROUTING_KEY);
    }
}
