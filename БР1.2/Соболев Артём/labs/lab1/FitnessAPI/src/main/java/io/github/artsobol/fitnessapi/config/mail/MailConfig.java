package io.github.artsobol.fitnessapi.config.mail;

import io.github.artsobol.fitnessapi.config.properties.mail.MailProperties;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.JavaMailSenderImpl;

@Configuration
@RequiredArgsConstructor
public class MailConfig {

    private final MailProperties mailProperties;

    @Bean
    public JavaMailSender mailSender() {
        JavaMailSenderImpl mailSender = new JavaMailSenderImpl();
        mailSender.setHost(mailProperties.host());
        mailSender.setPort(mailProperties.port());
        mailSender.setUsername(mailProperties.username());
        mailSender.setPassword(mailProperties.password());
        mailSender.setJavaMailProperties(mailProperties.properties());

        return mailSender;
    }
}
