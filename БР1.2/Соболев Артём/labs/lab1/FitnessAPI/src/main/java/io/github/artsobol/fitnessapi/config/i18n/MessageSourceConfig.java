package io.github.artsobol.fitnessapi.config.i18n;

import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.MessageSource;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.support.ReloadableResourceBundleMessageSource;

@Configuration
@EnableConfigurationProperties(I18nProperties.class)
public class MessageSourceConfig {

    @Bean
    MessageSource messageSource(I18nProperties properties) {
        ReloadableResourceBundleMessageSource messageSource = new ReloadableResourceBundleMessageSource();

        messageSource.setBasenames(properties.basename().split("\\s*,\\s*"));
        messageSource.setDefaultEncoding(properties.encoding());
        messageSource.setFallbackToSystemLocale(properties.fallbackToSystemLocale());
        messageSource.setCacheSeconds(properties.cacheSeconds());

        return messageSource;
    }
}
