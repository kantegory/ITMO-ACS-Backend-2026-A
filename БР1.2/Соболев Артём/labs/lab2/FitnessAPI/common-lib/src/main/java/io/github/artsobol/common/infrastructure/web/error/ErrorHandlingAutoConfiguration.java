package io.github.artsobol.common.infrastructure.web.error;

import io.github.artsobol.common.infrastructure.localization.MessageService;
import io.github.artsobol.common.infrastructure.web.error.advice.CommonControllerAdvice;
import jakarta.servlet.ServletException;
import org.springframework.boot.autoconfigure.AutoConfiguration;
import org.springframework.boot.autoconfigure.condition.ConditionalOnClass;
import org.springframework.boot.autoconfigure.condition.ConditionalOnMissingBean;
import org.springframework.boot.autoconfigure.condition.ConditionalOnWebApplication;
import org.springframework.context.MessageSource;
import org.springframework.context.annotation.Bean;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@AutoConfiguration
@ConditionalOnWebApplication(type = ConditionalOnWebApplication.Type.SERVLET)
@ConditionalOnClass({ServletException.class, RestControllerAdvice.class})
public class ErrorHandlingAutoConfiguration {

    @Bean
    @ConditionalOnMissingBean
    public MessageService messageService(MessageSource messageSource) {
        return new MessageService(messageSource);
    }

    @Bean
    @ConditionalOnMissingBean(annotation = RestControllerAdvice.class)
    public CommonControllerAdvice commonControllerAdvice(MessageService messageService) {
        return new CommonControllerAdvice(messageService);
    }
}
