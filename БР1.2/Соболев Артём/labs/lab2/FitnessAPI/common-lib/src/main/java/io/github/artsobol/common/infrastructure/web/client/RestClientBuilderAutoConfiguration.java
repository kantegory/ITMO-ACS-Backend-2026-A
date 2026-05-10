package io.github.artsobol.common.infrastructure.web.client;

import org.springframework.boot.autoconfigure.AutoConfiguration;
import org.springframework.boot.autoconfigure.condition.ConditionalOnClass;
import org.springframework.boot.autoconfigure.condition.ConditionalOnMissingBean;
import org.springframework.context.annotation.Bean;
import org.springframework.web.client.RestClient;

@AutoConfiguration(afterName = "org.springframework.boot.restclient.autoconfigure.RestClientAutoConfiguration")
@ConditionalOnClass(RestClient.class)
public class RestClientBuilderAutoConfiguration {

    @Bean
    @ConditionalOnMissingBean
    public RestClient.Builder restClientBuilder() {
        return RestClient.builder();
    }
}
