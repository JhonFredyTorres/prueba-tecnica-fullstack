package com.techtest.inventory.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.client.ClientHttpRequestInterceptor;
import org.springframework.web.client.RestTemplate;

import java.time.Duration;

/**
 * Configuración del RestTemplate para comunicación HTTP.
 *
 * Incluye:
 * - Timeouts de conexión y lectura
 * - Interceptor para agregar API Key automáticamente
 */
@Configuration
public class RestTemplateConfig {

    @Value("${services.products.connect-timeout:5000}")
    private int connectTimeout;

    @Value("${services.products.read-timeout:5000}")
    private int readTimeout;

    @Value("${api.security.key}")
    private String apiKey;

    @Bean
    public RestTemplate restTemplate(RestTemplateBuilder builder) {
        return builder
                // Timeouts
                .connectTimeout(Duration.ofMillis(connectTimeout))
                .readTimeout(Duration.ofMillis(readTimeout))
                // Interceptor para agregar API Key a todas las peticiones
                .additionalInterceptors(apiKeyInterceptor())
                .build();
    }

    /**
     * Interceptor que agrega el header X-API-Key a cada petición.
     * Así no tenemos que agregarlo manualmente cada vez.
     */
    private ClientHttpRequestInterceptor apiKeyInterceptor() {
        return (request, body, execution) -> {
            request.getHeaders().add("X-API-Key", apiKey);
            return execution.execute(request, body);
        };
    }
}