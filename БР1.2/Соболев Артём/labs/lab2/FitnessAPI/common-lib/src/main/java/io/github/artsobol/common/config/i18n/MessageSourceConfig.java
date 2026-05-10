package io.github.artsobol.common.config.i18n;

import org.springframework.boot.autoconfigure.AutoConfiguration;
import org.springframework.boot.autoconfigure.condition.ConditionalOnMissingBean;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.MessageSource;
import org.springframework.context.annotation.Bean;
import org.springframework.context.support.ReloadableResourceBundleMessageSource;

@AutoConfiguration
@EnableConfigurationProperties(I18nProperties.class)
public class MessageSourceConfig {

    @Bean
    @ConditionalOnMissingBean(MessageSource.class)
    public MessageSource messageSource(I18nProperties properties) {
        ReloadableResourceBundleMessageSource messageSource = new ReloadableResourceBundleMessageSource();

        messageSource.setBasenames(properties.basename().split("\\s*,\\s*"));
        messageSource.setDefaultEncoding(properties.encoding());
        messageSource.setFallbackToSystemLocale(properties.fallbackToSystemLocale());
        messageSource.setCacheSeconds(properties.cacheSeconds());

        return messageSource;
    }
}
