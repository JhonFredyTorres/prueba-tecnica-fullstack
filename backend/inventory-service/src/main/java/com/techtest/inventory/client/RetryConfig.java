package com.techtest.inventory.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.retry.annotation.EnableRetry;

/**
 * Habilita Spring Retry en la aplicación.
 *
 * Esto permite usar las anotaciones:
 * - @Retryable: en métodos que deben reintentarse si fallan
 * - @Recover: método fallback cuando se agotan los reintentos
 */
@Configuration
@EnableRetry
public class RetryConfig {
    // La configuración específica está en application.yml
    // y en las anotaciones @Retryable de cada método
}