package com.techtest.inventory.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.retry.annotation.EnableRetry;

/**
 * Habilita Spring Retry en la aplicación.

 */
@Configuration
@EnableRetry
public class RetryConfig {

}